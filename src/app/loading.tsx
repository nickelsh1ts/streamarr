export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <span className="text-lg text-white me-1">Loading</span> <span className="loading loading-dots loading-md text-primary mt-2"></span>
    </div>
  );
}
