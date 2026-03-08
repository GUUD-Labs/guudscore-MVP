export const Heading = ({
  title,
  description,
  badge,
}: {
  title?: string;
  description?: string;
  badge?: string;
}) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-1 sm:gap-1.5 p-4 sm:p-6 md:p-8 lg:p-10 text-center">
      {badge && (
        <span className="glass rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium select-none">
          {badge}
        </span>
      )}
      <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl">{title}</h1>
      <p className="mt-0! font-serif text-base sm:text-lg md:text-xl">{description}</p>
    </div>
  );
};
