export default function PublicLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "rgba(196,66,106,0.3)", borderTopColor: "#c4426a" }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
