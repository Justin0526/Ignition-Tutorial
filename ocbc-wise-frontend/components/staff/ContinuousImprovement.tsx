export default function ContinuousImprovement() {
    return (
        <section className="mt-8 rounded-2xl bg-red-500 px-8 py-8 text-white shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Continuous Improvement</h3>
                    <p className="mt-2 max-w-2xl text-white/90">
                        Adding self-service tutorials for the top 5 escalated issues can reduce branch
                        visits and improve customer satisfaction scores.
                    </p>
                </div>

                <button className="w-full cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-semibold text-red-600 shadow-sm hover:bg-white/80 lg:w-auto">
                    Build Custom Tutorial
                </button>
            </div>
        </section>
    )
}
