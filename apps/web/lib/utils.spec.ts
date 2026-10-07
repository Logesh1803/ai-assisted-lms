import {
  AVATAR_COLORS,
  avatarColor,
  formatDate,
  formatDuration,
  getInitials,
  timeAgo,
} from './utils';

describe('formatDate', () => {
  const newYear2026 = Date.UTC(2026, 0, 15, 12, 0, 0);

  it('renders a millisecond timestamp as a readable date', () => {
    expect(formatDate(newYear2026)).toBe('15 Jan 2026');
  });

  it('accepts the same instant as a number, a string or a bigint', () => {
    const asNumber = formatDate(newYear2026);
    expect(formatDate(String(newYear2026))).toBe(asNumber);
    expect(formatDate(BigInt(newYear2026))).toBe(asNumber);
  });
});

describe('formatDuration', () => {
  it('pads the seconds to two digits', () => {
    expect(formatDuration(95)).toBe('1:35');
    expect(formatDuration(65)).toBe('1:05');
  });

  it('renders under a minute with a zero minute part', () => {
    expect(formatDuration(9)).toBe('0:09');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('keeps counting minutes past an hour', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('getInitials', () => {
  it('takes the first letter of each name', () => {
    expect(getInitials('Ada', 'Lovelace')).toBe('AL');
  });

  it('upper-cases lowercase names', () => {
    expect(getInitials('ada', 'lovelace')).toBe('AL');
  });

  it('works with a first name only', () => {
    expect(getInitials('Ada')).toBe('A');
  });

  it('falls back to "?" when the name is missing or still loading', () => {
    expect(getInitials()).toBe('?');
    expect(getInitials('', '')).toBe('?');
    expect(getInitials(undefined, undefined)).toBe('?');
  });
});

describe('avatarColor', () => {
  it('always returns a colour from the palette', () => {
    expect(AVATAR_COLORS).toContain(avatarColor('Ada'));
    expect(AVATAR_COLORS).toContain(avatarColor(''));
  });

  it('gives the same name the same colour every time', () => {
    expect(avatarColor('Ada Lovelace')).toBe(avatarColor('Ada Lovelace'));
  });

  it('handles a missing name without crashing', () => {
    expect(AVATAR_COLORS).toContain(avatarColor());
  });
});

describe('timeAgo', () => {
  const NOW = Date.UTC(2026, 5, 15, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const secondsAgo = (seconds: number) => NOW - seconds * 1000;
  const minutesAgo = (minutes: number) => NOW - minutes * 60_000;
  const hoursAgo = (hours: number) => NOW - hours * 3_600_000;
  const daysAgo = (days: number) => NOW - days * 86_400_000;

  it('says "just now" for anything under a minute', () => {
    expect(timeAgo(NOW)).toBe('just now');
    expect(timeAgo(secondsAgo(59))).toBe('just now');
  });

  it('counts in minutes up to an hour', () => {
    expect(timeAgo(minutesAgo(1))).toBe('1m');
    expect(timeAgo(minutesAgo(59))).toBe('59m');
  });

  it('switches to hours at the hour mark', () => {
    expect(timeAgo(hoursAgo(1))).toBe('1h');
    expect(timeAgo(hoursAgo(23))).toBe('23h');
  });

  it('switches to days at the day mark', () => {
    expect(timeAgo(daysAgo(1))).toBe('1d');
    expect(timeAgo(daysAgo(6))).toBe('6d');
  });

  it('falls back to a calendar date after a week', () => {
    expect(timeAgo(daysAgo(7))).toBe('Jun 8');
    expect(timeAgo(daysAgo(30))).toBe('May 16');
  });

  it('accepts a string or bigint timestamp', () => {
    expect(timeAgo(String(minutesAgo(5)))).toBe('5m');
    expect(timeAgo(BigInt(minutesAgo(5)))).toBe('5m');
  });
});
