import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
    });

    it('should merge tailwind classes correctly', () => {
      // tailwind-merge should dedupe conflicting classes
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should handle object notation', () => {
      expect(cn({ active: true, disabled: false })).toBe('active');
    });

    it('should handle array notation', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
  });
});
