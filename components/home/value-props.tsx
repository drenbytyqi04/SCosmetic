import { FlaskConical, MessageCircleHeart, Sparkles, Truck } from 'lucide-react';

const VALUES = [
  {
    icon: FlaskConical,
    title: 'Formulation first',
    description:
      'We read the full INCI list before we stock anything. If a claim is not supported, it does not go on the shelf.',
  },
  {
    icon: Sparkles,
    title: 'A short catalogue',
    description:
      'Around thirty products, not three thousand. Everything here is something we would hand a friend.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Real shade matching',
    description:
      'Send us a photo in daylight and we will match your foundation properly, before you buy.',
  },
  {
    icon: Truck,
    title: 'Dispatched same day',
    description:
      'Order before 15:00 on a working day and it leaves Prishtina the same afternoon.',
  },
] as const;

/** Trust band under the hero. Static, server-rendered. */
export function ValueProps() {
  return (
    <section aria-labelledby="values-heading" className="border-y border-border bg-surface">
      <h2 id="values-heading" className="sr-only">
        Why shop with us
      </h2>

      <div className="container-page py-10 lg:py-14">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {VALUES.map((value) => (
            <li key={value.title} className="flex flex-col gap-3">
              <value.icon className="size-5 text-champagne-500" aria-hidden="true" />
              <h3 className="font-serif text-lg font-normal text-foreground">{value.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{value.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
