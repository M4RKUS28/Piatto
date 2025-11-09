/**
 * Shared Audio Context Manager for Mobile Browser Compatibility
 *
 * Mobile browsers (Safari, Firefox Mobile, etc.) have strict autoplay policies:
 * - AudioContext starts in "suspended" state
 * - Must be resumed/unlocked by a user gesture
 * - This utility provides a singleton AudioContext that can be unlocked early
 */

let sharedAudioContext = null;
let isUnlocked = false;

/**
 * Get or create the shared AudioContext
 * @returns {AudioContext|null}
 */
export const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextConstructor();
  }

  return sharedAudioContext;
};

/**
 * Unlock audio on mobile browsers by playing a silent buffer
 * Must be called from a user gesture event (click, touch, etc.)
 * @returns {Promise<boolean>} true if unlocked successfully
 */
export const unlockAudio = async () => {
  if (isUnlocked) {
    return true;
  }

  const context = getAudioContext();
  if (!context) {
    return false;
  }

  try {
    // Resume the context if suspended
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Play a silent buffer to unlock audio on iOS/mobile browsers
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);

    isUnlocked = true;
    console.log('[AudioContext] Audio unlocked successfully');
    return true;
  } catch (error) {
    console.warn('[AudioContext] Failed to unlock audio:', error);
    return false;
  }
};

/**
 * Resume the audio context if it's suspended
 * Should be called before playing any audio
 * @returns {Promise<boolean>}
 */
export const resumeAudioContext = async () => {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  try {
    if (context.state === 'suspended') {
      await context.resume();
      console.log('[AudioContext] Resumed from suspended state');
    }
    return true;
  } catch (error) {
    console.warn('[AudioContext] Failed to resume audio context:', error);
    return false;
  }
};

/**
 * Check if audio is ready to play
 * @returns {boolean}
 */
export const isAudioReady = () => {
  const context = getAudioContext();
  return context && context.state === 'running';
};

/**
 * Get the current state of the audio context
 * @returns {string} 'suspended', 'running', 'closed', or 'unavailable'
 */
export const getAudioState = () => {
  const context = getAudioContext();
  return context ? context.state : 'unavailable';
};

/**
 * Close the shared audio context (cleanup)
 */
export const closeAudioContext = () => {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    sharedAudioContext.close();
    sharedAudioContext = null;
    isUnlocked = false;
  }
};
