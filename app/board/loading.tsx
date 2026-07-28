export default function BoardLoading() {
  return (
    <div className="w-screen h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 animate-pulse">
          <div className="w-8 h-8 bg-white/80 rounded-lg" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight animate-pulse">Loading Board...</h1>
      </div>
    </div>
  );
}
