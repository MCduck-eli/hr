import Skeleton from "@/src/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 font-sans w-full">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="w-56 h-7 rounded-lg" />
                        <Skeleton className="w-36 h-4 rounded-md" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="w-28 h-10 rounded-xl" />
                    <Skeleton className="w-32 h-10 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="w-24 h-4 rounded" />
                            <Skeleton className="w-8 h-8 rounded-xl" />
                        </div>
                        <Skeleton className="w-20 h-8 rounded-lg" />
                        <Skeleton className="w-28 h-3 rounded" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                        <Skeleton className="w-36 h-5 rounded-lg" />
                        <div className="space-y-3 pt-2">
                            <Skeleton className="w-full h-10 rounded-xl" />
                            <Skeleton className="w-full h-10 rounded-xl" />
                            <Skeleton className="w-full h-10 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <Skeleton className="w-40 h-6 rounded-lg" />
                            <Skeleton className="w-24 h-8 rounded-xl" />
                        </div>
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="w-48 h-4 rounded" />
                                        <Skeleton className="w-16 h-4 rounded" />
                                    </div>
                                    <Skeleton className="w-full h-2 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
