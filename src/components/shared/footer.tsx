import Icons from '@/components/icons';

export const Footer = () => {
  const socialLinks = [
    {
      name: 'X (Twitter)',
      icon: Icons.twitter,
      url: 'https://x.com/guudxyz',
    },
    {
      name: 'Discord',
      icon: Icons.discord,
      url: 'https://discord.com/invite/RjFZaBtZEG',
    },
    {
      name: 'GitHub',
      icon: Icons.github,
      url: 'https://github.com/GUUD-Labs',
    },
    {
      name: 'Docs',
      icon: Icons.docs,
      url: 'https://docs.guud.fun',
    },
  ];

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/guud-logo.svg"
              alt="GUUD"
              className="h-12 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © 2026 <span className="font-pixel">GUUD</span>. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            {socialLinks.map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={link.name}
              >
                <link.icon className="size-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
