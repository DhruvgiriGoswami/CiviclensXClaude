import { useEffect, useRef } from 'react';

// Open dialogs, newest last. Only the top one answers Esc and Tab, so nested dialogs close one at a time.
const stack = [];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Esc closes, focus moves into the dialog on open and back to the trigger on close, Tab stays inside.
export function useDialog(isOpen, onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    const trigger = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE);
    (first || node)?.focus?.();

    const token = {};
    stack.push(token);

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) trigger.focus();
    };
  }, [isOpen]);

  return ref;
}
