"use client";

interface Props {
  src: string | null;
  name: string;
  initial: string;
}

export function AuthorAvatarImg({ src, name, initial }: Props) {
  return (
    <>
      {/* Initial always in DOM; parent provides bg and centering */}
      <span aria-hidden="true">{initial}</span>
      {/* Image absolutely positioned on top; hides on error */}
      {src && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
    </>
  );
}
