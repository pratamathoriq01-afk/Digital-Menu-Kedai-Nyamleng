import { useEffect } from 'react';

/**
 * Utility langsung untuk mengunci / membuka scroll body
 * @param lock - true untuk mengunci (overflow: hidden), false untuk membuka
 */
export const lockBodyScroll = (lock: boolean): void => {
  if (typeof document === 'undefined') return;
  if (lock) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

/**
 * Custom React Hook untuk otomatisasi kunci scroll body saat modal/drawer terbuka
 * @param isOpen - boolean penanda apakah modal atau drawer sedang aktif/terbuka
 */
export function useBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = previousOverflow || '';
      };
    }
  }, [isOpen]);
}
