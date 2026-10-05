type SectionEyebrowProps = {
  children: React.ReactNode;
};

export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return (
    <div className="section-eyebrow">
      <span className="eyebrow-dot" />
      {children}
    </div>
  );
}
