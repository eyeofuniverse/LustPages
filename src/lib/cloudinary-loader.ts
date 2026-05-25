type LoaderParams = { src: string; width: number; quality?: number };

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  if (!src.includes("res.cloudinary.com")) return src;

  const [base, rest] = src.split("/upload/");
  if (!rest) return src;

  const q = quality ?? 75;
  return `${base}/upload/w_${width},q_${q},f_auto,c_limit/${rest}`;
}
