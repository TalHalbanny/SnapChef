type RecipeCardProps = {
  title: string;
  timestemp: string;
};

export function RecipeCard({ title, timestemp }: RecipeCardProps) {
  return (
    <article
      style={{ backgroundColor: "#9CAB84" }}
      className="rounded-2xl bg-white/90 p-4 shadow-md"
    >
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white">{timestemp}</p>
    </article>
  );
}
