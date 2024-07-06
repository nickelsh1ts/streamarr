export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-t-4 border-primary rounded-full" />
    </div>
  );
}
