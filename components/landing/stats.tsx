export function Stats() {
    return (
        <section className="bg-muted/30 py-16 border-y border-border/50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border/50 text-center">
                    <div className="p-4 space-y-2">
                        <h3 className="text-4xl font-bold text-primary">10M+</h3>
                        <p className="text-muted-foreground font-medium">Posts Scheduled</p>
                    </div>
                    <div className="p-4 space-y-2">
                        <h3 className="text-4xl font-bold text-primary">50k+</h3>
                        <p className="text-muted-foreground font-medium">Happy Brands</p>
                    </div>
                    <div className="p-4 space-y-2">
                        <h3 className="text-4xl font-bold text-primary">140+</h3>
                        <p className="text-muted-foreground font-medium">Countries Supported</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
