/**
 * Reusable Framer Motion variants for consistent animations
 * Respects prefers-reduced-motion
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: reducedMotion ? 0 : 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
  exit: {
    opacity: 0,
    y: reducedMotion ? 0 : -12,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
};

// Card variants (tasks, habits, goals)
export const cardVariants = {
  initial: {
    opacity: 0,
    y: reducedMotion ? 0 : 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
  hover: {
    scale: reducedMotion ? 1 : 1.015,
    boxShadow: reducedMotion 
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 8px 24px rgba(0, 255, 255, 0.15)',
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
};

// Staggered container for lists
export const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Modal variants
export const modalBackdropVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export const modalContentVariants = {
  initial: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
  exit: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.95,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
};

// Dropdown menu variants
export const dropdownVariants = {
  initial: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.95,
    y: reducedMotion ? 0 : -8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
  exit: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.95,
    y: reducedMotion ? 0 : -4,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.1, 0.25, 1] as any,
    },
  },
};

// Button press effect
export const buttonVariants = {
  tap: {
    scale: reducedMotion ? 1 : 0.97,
    transition: {
      duration: 0.1,
    },
  },
};
