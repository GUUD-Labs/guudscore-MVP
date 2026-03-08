import {
    BarChart3,
    CreditCard,
    Gift,
    Image,
    LayoutDashboard,
    type LucideProps,
    Plus,
    Share2,
    Users,
    Wallet,
    Zap
} from 'lucide-react';

const Icons = {
  chevronDown: (props: LucideProps) => (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="9.3999"
        width="3"
        height="3.00002"
        transform="rotate(90 9.3999 0)"
        fill="currentColor"
      />
      <rect
        x="6.3999"
        y="3"
        width="3"
        height="3.00002"
        transform="rotate(90 6.3999 3)"
        fill="currentColor"
      />
      <rect
        x="3.40015"
        width="3"
        height="3.00002"
        transform="rotate(90 3.40015 0)"
        fill="currentColor"
      />
    </svg>
  ),
  chevronRight: (props: LucideProps) => (
    <svg
      width="10"
      height="15"
      viewBox="0 0 10 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect y="0.000244141" width="5" height="5" fill="currentColor" />
      <rect x="5" y="5.00024" width="5" height="5" fill="currentColor" />
      <rect y="9.99976" width="5" height="5" fill="currentColor" />
    </svg>
  ),
  chevronUp: (props: LucideProps) => (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="0.899902"
        y="6"
        width="3"
        height="3.00002"
        transform="rotate(-90 0.899902 6)"
        fill="currentColor"
      />
      <rect
        x="3.8999"
        y="3"
        width="3"
        height="3.00002"
        transform="rotate(-90 3.8999 3)"
        fill="currentColor"
      />
      <rect
        x="6.89966"
        y="6"
        width="3"
        height="3.00002"
        transform="rotate(-90 6.89966 6)"
        fill="currentColor"
      />
    </svg>
  ),
  moon: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M6 2h8v2h-2v2h-2V4H6zM4 6V4h2v2zm0 10H2V6h2zm2 2H4v-2h2zm2 2H6v-2h2zm10 0v2H8v-2zm2-2v2h-2v-2zm-2-4h2v4h2v-8h-2v2h-2zm-6 0v2h6v-2zm-2-2h2v2h-2zm0 0V6H8v6z"
      />
    </svg>
  ),
  search: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M6 2h8v2H6zM4 6V4h2v2zm0 8H2V6h2zm2 2H4v-2h2zm8 0v2H6v-2zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2zm0-8h2v8h-2zm0 0V4h-2v2z"
      />
    </svg>
  ),
  sun: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13 3H11V5H13V3ZM17 5H19V7H17V5ZM11 11H13V13H11V11ZM3 11H5V13H3V11ZM21 11H19V13H21V11ZM5 5H7V7H5V5ZM19 19H17V17H19V19ZM11 21H13V19H11V21ZM7 19H5V17H7V19ZM9 7H15V9H9V7ZM9 15H7V9H9V15ZM9 15V17H15V15H17V9H15V15H9Z"
        fill="currentColor"
      />
    </svg>
  ),
  xLogo: (props: LucideProps) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  twitter: (props: LucideProps) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  trendingUp: (props: LucideProps) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="m3 17 6-6 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14 5 7 0 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  trendingDown: (props: LucideProps) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="m3 7 6 6 4-4 8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14 19 7 0 0-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  trophy: (props: LucideProps) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 22h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.66V17a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2.34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 2H6v7a6 6 0 0 0 12 0V2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  crown: (props: LucideProps) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chevronLeft: (props: LucideProps) => (
    <svg
      width="10"
      height="15"
      viewBox="0 0 10 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="5" y="0.000244141" width="5" height="5" fill="currentColor" />
      <rect y="5.00024" width="5" height="5" fill="currentColor" />
      <rect x="5" y="9.99976" width="5" height="5" fill="currentColor" />
    </svg>
  ),
  dots: (props: LucideProps) => (
    <svg
      width="15"
      height="3"
      viewBox="0 0 15 3"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="3" height="3" fill="currentColor" />
      <rect x="6" width="3" height="3" fill="currentColor" />
      <rect x="12" width="3" height="3" fill="currentColor" />
    </svg>
  ),
  lock: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="6" y="10" width="12" height="8" fill="currentColor" />
      <rect x="8" y="8" width="2" height="4" fill="currentColor" />
      <rect x="14" y="8" width="2" height="4" fill="currentColor" />
      <rect x="8" y="6" width="8" height="2" fill="currentColor" />
    </svg>
  ),
  login: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="6" width="2" height="12" fill="currentColor" />
      <rect x="5" y="6" width="8" height="2" fill="currentColor" />
      <rect x="5" y="16" width="8" height="2" fill="currentColor" />
      <rect x="13" y="8" width="2" height="8" fill="currentColor" />
      <rect x="15" y="10" width="3" height="2" fill="currentColor" />
      <rect x="18" y="12" width="3" height="2" fill="currentColor" />
      <rect x="15" y="12" width="3" height="2" fill="currentColor" />
    </svg>
  ),
  user: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="8" y="4" width="8" height="2" fill="currentColor" />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" />
      <rect x="16" y="6" width="2" height="2" fill="currentColor" />
      <rect x="4" y="8" width="2" height="4" fill="currentColor" />
      <rect x="18" y="8" width="2" height="4" fill="currentColor" />
      <rect x="6" y="12" width="12" height="2" fill="currentColor" />
      <rect x="8" y="14" width="8" height="2" fill="currentColor" />
      <rect x="6" y="16" width="2" height="2" fill="currentColor" />
      <rect x="16" y="16" width="2" height="2" fill="currentColor" />
      <rect x="8" y="18" width="8" height="2" fill="currentColor" />
    </svg>
  ),
  logOut: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="4" width="12" height="2" fill="currentColor" />
      <rect x="2" y="6" width="2" height="12" fill="currentColor" />
      <rect x="2" y="18" width="12" height="2" fill="currentColor" />
      <rect x="12" y="6" width="2" height="2" fill="currentColor" />
      <rect x="12" y="16" width="2" height="2" fill="currentColor" />
      <rect x="14" y="10" width="2" height="4" fill="currentColor" />
      <rect x="16" y="8" width="2" height="2" fill="currentColor" />
      <rect x="18" y="10" width="2" height="4" fill="currentColor" />
      <rect x="20" y="12" width="2" height="2" fill="currentColor" />
      <rect x="16" y="14" width="2" height="2" fill="currentColor" />
    </svg>
  ),
  settings: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="10" y="2" width="4" height="2" fill="currentColor" />
      <rect x="8" y="4" width="2" height="2" fill="currentColor" />
      <rect x="14" y="4" width="2" height="2" fill="currentColor" />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" />
      <rect x="16" y="6" width="2" height="2" fill="currentColor" />
      <rect x="4" y="8" width="2" height="8" fill="currentColor" />
      <rect x="18" y="8" width="2" height="8" fill="currentColor" />
      <rect x="6" y="16" width="2" height="2" fill="currentColor" />
      <rect x="16" y="16" width="2" height="2" fill="currentColor" />
      <rect x="8" y="18" width="2" height="2" fill="currentColor" />
      <rect x="14" y="18" width="2" height="2" fill="currentColor" />
      <rect x="10" y="20" width="4" height="2" fill="currentColor" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" />
    </svg>
  ),
  dashboard: (props: LucideProps) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 2x2 grid layout for dashboard */}
      <rect x="3" y="3" width="8" height="8" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" fill="currentColor" />
      <rect x="13" y="13" width="8" height="8" fill="currentColor" />
      {/* Inner holes for pixel effect */}
      <rect x="5" y="5" width="4" height="4" fill="transparent" />
      <rect x="15" y="5" width="4" height="4" fill="transparent" />
      <rect x="5" y="15" width="4" height="4" fill="transparent" />
      <rect x="15" y="15" width="4" height="4" fill="transparent" />
    </svg>
  ),
  wallet: Wallet,
  plus: Plus,
  layoutDashboard: LayoutDashboard,
  image: Image,
  barChart3: BarChart3,
  users: Users,
  creditCard: CreditCard,
  share2: Share2,
  zap: Zap,
  eye: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  upload: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  ),
  facebook: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"
      />
    </svg>
  ),
  discord: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
      />
    </svg>
  ),
  github: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.001 2c-5.525 0-10 4.475-10 10a9.99 9.99 0 0 0 6.837 9.488c.5.087.688-.213.688-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.337 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.687c-.1-.25-.45-1.275.1-2.65c0 0 .837-.263 2.75 1.024a9.3 9.3 0 0 1 2.5-.337c.85 0 1.7.112 2.5.337c1.913-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.02 10.02 0 0 0 22 12c0-5.525-4.475-10-10-10"
      />
    </svg>
  ),
  instagram: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.001 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6m0-2a5 5 0 1 1 0 10a5 5 0 0 1 0-10m6.5-.25a1.25 1.25 0 0 1-2.5 0a1.25 1.25 0 0 1 2.5 0M12.001 4c-2.474 0-2.878.007-4.029.058c-.784.037-1.31.142-1.798.332a2.9 2.9 0 0 0-1.08.703a2.9 2.9 0 0 0-.704 1.08c-.19.49-.295 1.015-.331 1.798C4.007 9.075 4 9.461 4 12c0 2.475.007 2.878.058 4.029c.037.783.142 1.31.331 1.797c.17.435.37.748.702 1.08c.337.336.65.537 1.08.703c.494.191 1.02.297 1.8.333C9.075 19.994 9.461 20 12 20c2.475 0 2.878-.007 4.029-.058c.782-.037 1.308-.142 1.797-.331a2.9 2.9 0 0 0 1.08-.703c.337-.336.538-.649.704-1.08c.19-.492.296-1.018.332-1.8c.052-1.103.058-1.49.058-4.028c0-2.474-.007-2.878-.058-4.029c-.037-.782-.143-1.31-.332-1.798a2.9 2.9 0 0 0-.703-1.08a2.9 2.9 0 0 0-1.08-.704c-.49-.19-1.016-.295-1.798-.331C14.926 4.006 14.54 4 12 4m0-2c2.717 0 3.056.01 4.123.06c1.064.05 1.79.217 2.427.465c.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428c.047 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122s-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772a4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.427.465c-1.067.047-1.406.06-4.123.06s-3.056-.01-4.123-.06c-1.064-.05-1.789-.218-2.427-.465a4.9 4.9 0 0 1-1.772-1.153a4.9 4.9 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.012 15.056 2 14.717 2 12s.01-3.056.06-4.122s.217-1.79.465-2.428a4.9 4.9 0 0 1 1.153-1.772A4.9 4.9 0 0 1 5.45 2.525c.637-.248 1.362-.415 2.427-.465C8.945 2.013 9.284 2 12.001 2"
      />
    </svg>
  ),
  linkedin: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"
      />
    </svg>
  ),
  telegram: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M2.148 11.81q7.87-3.429 10.497-4.522c4.999-2.079 6.037-2.44 6.714-2.452c.15-.003.482.034.698.21c.182.147.232.347.256.487s.054.459.03.708c-.27 2.847-1.443 9.754-2.04 12.942c-.252 1.348-.748 1.8-1.23 1.845c-1.045.096-1.838-.69-2.85-1.354c-1.585-1.039-2.48-1.686-4.018-2.699c-1.777-1.171-.625-1.815.388-2.867c.265-.275 4.87-4.464 4.96-4.844c.01-.048.021-.225-.084-.318c-.105-.094-.26-.062-.373-.036q-.239.054-7.592 5.018q-1.079.74-1.952.721c-.643-.014-1.88-.363-2.798-.662c-1.128-.367-2.024-.56-1.946-1.183q.061-.486 1.34-.994"
      />
    </svg>
  ),
  tiktok: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"
      />
    </svg>
  ),
  whatsapp: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="m7.254 18.494l.724.423A7.95 7.95 0 0 0 12.001 20a8 8 0 1 0-8-8a7.95 7.95 0 0 0 1.084 4.024l.422.724l-.653 2.401zM2.005 22l1.352-4.968A9.95 9.95 0 0 1 2.001 12c0-5.523 4.477-10 10-10s10 4.477 10 10s-4.477 10-10 10a9.95 9.95 0 0 1-5.03-1.355zM8.392 7.308q.202-.014.403-.004q.081.006.162.016c.159.018.334.115.393.249q.447 1.015.868 2.04c.062.152.025.347-.093.537c-.06.097-.154.233-.263.372c-.113.145-.356.411-.356.411s-.099.118-.061.265c.014.056.06.137.102.205l.059.095c.256.427.6.86 1.02 1.268c.12.116.237.235.363.346c.468.413.998.75 1.57 1l.005.002c.085.037.128.057.252.11q.093.039.191.066q.036.01.073.011a.35.35 0 0 0 .295-.142c.723-.876.79-.933.795-.933v.002a.48.48 0 0 1 .378-.127q.092.004.177.04c.531.243 1.4.622 1.4.622l.582.261c.098.047.187.158.19.265c.004.067.01.175-.013.373c-.032.259-.11.57-.188.733a1.2 1.2 0 0 1-.21.302a2.4 2.4 0 0 1-.33.288q-.124.092-.125.09a5 5 0 0 1-.383.22a2 2 0 0 1-.833.23c-.185.01-.37.024-.556.014c-.008 0-.568-.087-.568-.087a9.45 9.45 0 0 1-3.84-2.046c-.226-.199-.436-.413-.65-.626c-.888-.885-1.561-1.84-1.97-2.742a3.5 3.5 0 0 1-.33-1.413a2.73 2.73 0 0 1 .565-1.68c.073-.094.142-.192.261-.305c.126-.12.207-.184.294-.228a1 1 0 0 1 .371-.1"
      />
    </svg>
  ),
  spinner: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  docs: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      <path d="M8 11h8" />
      <path d="M8 7h6" />
    </svg>
  ),
  filter: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  badge: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    </svg>
  ),
  x: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  thumbsUp: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  ),
  thumbsDown: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  ),
  heart: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  gift: (props: LucideProps) => <Gift {...props} />,
  star: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  arena: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1080"
      width={24}
      height={24}
      fill="currentColor"
      {...props}
    >
      <path d="M932.71,399.61v673.73h-17.22V449.94c0-207.09-168.63-375.72-375.72-375.72S164.51,242.43,164.51,449.94v623.39h-17.22V399.61C147.29,182.39,322.98,6.67,540.23,6.67s392.48,175.72,392.48,392.94Z"/>
      <path d="M864.27,438.01v571.76h-17.22V481.71c0-169.52-137.73-307.28-307.28-307.28S232.47,311.73,232.47,481.28v528.03h-17.19V437.57c0-179.25,145.27-324.5,324.5-324.5s324.5,145.24,324.5,324.5c0,0,0,.43,0,.43Z"/>
      <path d="M796.28,476.43v469.31h-17.22v-432.69c0-131.99-107.28-239.29-239.29-239.29s-239.26,107.3-239.26,239.31v432.69h-17.22v-469.33c0-141.71,114.79-256.51,256.51-256.51s256.08,114.79,256.08,256.51h.43-.03Z"/>
      <path d="M727.83,514.86v367.31h-17.22v-337.35c-.08-94.32-76.52-170.76-170.84-170.84-94.04,0-170.87,76.8-170.87,170.84v337.32h-17.22v-367.31c.1-103.83,84.25-187.98,188.09-188.06,103.82.1,187.97,84.24,188.06,188.06v.03Z"/>
      <path d="M659.87,553.23v265.37h-17.24v-241.93c-.07-56.78-46.08-102.79-102.86-102.86-56.71-.1-102.76,45.79-102.86,102.5,0,.12,0,.24,0,.36v241.93h-17.24v-265.37c.07-66.3,53.8-120.02,120.1-120.08,66.23,0,119.64,53.84,119.64,120.1h.43l.03-.03Z"/>
      <path d="M591.43,591.66v162.92h-17.22v-146.59c0-18.97-15.44-34.44-34.44-34.44s-34.44,15.47-34.44,34.44v146.59h-17.22v-162.92c0-28.7,23.42-51.66,51.66-51.66s51.66,23.39,51.66,51.66Z"/>
    </svg>
  ),
};

export default Icons;

export type { LucideProps };
