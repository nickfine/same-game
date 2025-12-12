// ═══════════════════════════════════════════════════════════════
// HYPERSTREAK ANTI-CHEAT CLOUD FUNCTION
// Prevents bar exploits by validating increments
// Reverts + bans if cheating detected
// ═══════════════════════════════════════════════════════════════

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Maximum allowed hyper_bar value
const HYPER_BAR_MAX = 10;

/**
 * Validates hyperstreak updates
 * - Bar can only increment by 1 at a time
 * - Bar cannot exceed HYPER_BAR_MAX (10)
 * - Detects and flags cheaters
 */
export const onHyperstreakUpdate = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid;
    
    // Only check if hyper_bar changed
    const beforeBar = before?.hyper_bar ?? 0;
    const afterBar = after?.hyper_bar ?? 0;
    
    if (beforeBar === afterBar) {
      return null; // No change to hyper_bar
    }
    
    // Check for valid transitions:
    // 1. Increment by exactly 1 (normal progress)
    // 2. Reset to 0 (activation, crash, or wrong answer)
    // 3. Value stays within bounds (0-10)
    
    const isValidIncrement = afterBar === beforeBar + 1;
    const isValidReset = afterBar === 0;
    const isWithinBounds = afterBar >= 0 && afterBar <= HYPER_BAR_MAX;
    
    // Detect cheating
    const isCheat = (
      // Bar jumped by more than 1
      (afterBar > beforeBar + 1) ||
      // Bar exceeds max
      (afterBar > HYPER_BAR_MAX) ||
      // Bar went negative
      (afterBar < 0) ||
      // Non-standard transition (not increment by 1 or reset)
      (!isValidIncrement && !isValidReset && afterBar !== beforeBar)
    );
    
    if (isCheat) {
      console.warn(`[ANTI-CHEAT] Hyperstreak cheat detected for user ${uid}`);
      console.warn(`  Before: ${beforeBar}, After: ${afterBar}`);
      
      // Revert the change and flag the user
      try {
        await change.after.ref.update({
          hyper_bar: beforeBar, // Revert to previous value
          cheat_flag: true,
          cheat_detected_at: admin.firestore.FieldValue.serverTimestamp(),
          cheat_details: {
            type: 'hyperstreak_bar_exploit',
            attempted_value: afterBar,
            reverted_to: beforeBar,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.warn(`[ANTI-CHEAT] Reverted and flagged user ${uid}`);
        
        // Optionally: Send alert to admin/analytics
        // await sendCheatAlert(uid, 'hyperstreak_bar_exploit', { beforeBar, afterBar });
        
      } catch (error) {
        console.error(`[ANTI-CHEAT] Failed to revert cheat for ${uid}:`, error);
      }
    }
    
    return null;
  });

/**
 * Additional validation for in_hyperstreak transitions
 * Ensures hyperstreak can only be activated legitimately
 */
export const onHyperstreakActivation = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid;
    
    const wasInHyper = before?.in_hyperstreak ?? false;
    const isInHyper = after?.in_hyperstreak ?? false;
    
    // Only check if transitioning INTO hyperstreak
    if (!wasInHyper && isInHyper) {
      const beforeBar = before?.hyper_bar ?? 0;
      
      // Hyperstreak should only activate when bar was at max (10)
      // After activation, bar resets to 0
      const isValidActivation = beforeBar >= HYPER_BAR_MAX || beforeBar === 0;
      
      if (!isValidActivation) {
        console.warn(`[ANTI-CHEAT] Invalid hyperstreak activation for user ${uid}`);
        console.warn(`  Bar was ${beforeBar}, should have been ${HYPER_BAR_MAX}`);
        
        // Revert the activation
        try {
          await change.after.ref.update({
            in_hyperstreak: false,
            questions_in_hyper: 0,
            cheat_flag: true,
            cheat_detected_at: admin.firestore.FieldValue.serverTimestamp(),
            cheat_details: {
              type: 'hyperstreak_activation_exploit',
              bar_value_at_activation: beforeBar,
              timestamp: new Date().toISOString(),
            },
          });
          
          console.warn(`[ANTI-CHEAT] Reverted activation and flagged user ${uid}`);
          
        } catch (error) {
          console.error(`[ANTI-CHEAT] Failed to revert activation for ${uid}:`, error);
        }
      }
    }
    
    return null;
  });

/**
 * Validate questions_in_hyper doesn't exceed duration
 */
export const onHyperQuestionsUpdate = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const uid = context.params.uid;
    
    const questionsInHyper = after?.questions_in_hyper ?? 0;
    const HYPER_DURATION = 5;
    
    // If questions_in_hyper exceeds duration, it's suspicious
    if (questionsInHyper > HYPER_DURATION) {
      console.warn(`[ANTI-CHEAT] Invalid questions_in_hyper for user ${uid}: ${questionsInHyper}`);
      
      // Reset hyperstreak state
      try {
        await change.after.ref.update({
          in_hyperstreak: false,
          questions_in_hyper: 0,
          hyper_bar: 0,
          cheat_flag: true,
          cheat_detected_at: admin.firestore.FieldValue.serverTimestamp(),
          cheat_details: {
            type: 'hyperstreak_duration_exploit',
            questions_in_hyper: questionsInHyper,
            timestamp: new Date().toISOString(),
          },
        });
        
      } catch (error) {
        console.error(`[ANTI-CHEAT] Failed to reset hyperstreak for ${uid}:`, error);
      }
    }
    
    return null;
  });

