import type { Metadata } from 'next';
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/contact/contact-form';
import { PageHeader } from '@/components/shared/page-header';
import { StructuredData } from '@/components/shared/structured-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { commerceConfig, siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/structured-data';
import { formatPrice } from '@/lib/utils/format';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'Shade matching, order questions and product advice — message us and we reply within one working day. Based in Prishtina.',
  path: '/contact',
});

const FAQS = [
  {
    question: 'How long does delivery take?',
    answer:
      'Standard delivery arrives in 2–4 working days anywhere in Kosovo and is free on orders over €50. Express delivery arrives the next working day. Orders placed before 15:00 on a working day leave Prishtina the same afternoon.',
  },
  {
    question: 'Can you help me find my foundation shade?',
    answer:
      'Yes, and it is the thing we are asked most. Send us a photo of your bare skin in daylight, plus the shade you wear in another brand if you have one, and we will match you before you buy.',
  },
  {
    question: 'Can I return a product?',
    answer:
      'Unopened products can be returned within 14 days of delivery. For hygiene reasons we cannot accept opened cosmetics. If a product arrives damaged or is not what you ordered, tell us and we will replace it or refund you in full.',
  },
  {
    question: 'Do you ship outside Kosovo?',
    answer:
      'We ship to Albania, North Macedonia, Montenegro and Serbia. Delivery times and rates are shown at checkout once you select your country.',
  },
  {
    question: 'Are your products authentic?',
    answer:
      'Everything we sell is bought directly from the brand or its authorised distributor for this region. We can provide documentation for any product on request.',
  },
] as const;

export default function ContactPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Talk to us"
        title="Contact"
        description="Shade matching, order questions, product advice. A real person answers, usually within one working day."
        trail={trail}
      />

      <div className="container-page py-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <div className="min-w-0">
            <h2 className="mb-6 font-serif text-2xl font-light text-foreground">Send a message</h2>
            <ContactForm />

            <section aria-labelledby="faq-heading" className="mt-16">
              <h2 id="faq-heading" className="mb-4 font-serif text-2xl font-light text-foreground">
                Common questions
              </h2>
              <Accordion type="single" collapsible className="border-t border-border">
                {FAQS.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-5 font-serif text-lg font-light text-foreground">
                Reach us directly
              </h2>

              <ul className="flex flex-col gap-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Email</span>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {siteConfig.email}
                    </a>
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Phone</span>
                    <a
                      href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {siteConfig.phone}
                    </a>
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Instagram
                    className="mt-0.5 size-4 shrink-0 text-champagne-500"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-xs text-muted-foreground">Instagram</span>
                    <a
                      href={siteConfig.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {siteConfig.instagramHandle}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Studio</span>
                    <span className="text-foreground">
                      {siteConfig.address.street}
                      <br />
                      {siteConfig.address.postalCode} {siteConfig.address.city},{' '}
                      {siteConfig.address.country}
                    </span>
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Hours</span>
                    <span className="text-foreground">{siteConfig.openingHours}</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-cream-100 p-6 text-sm">
              <h2 className="mb-2 font-serif text-lg font-light text-foreground">
                Delivery at a glance
              </h2>
              <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
                <li>
                  Free standard delivery over{' '}
                  <strong className="font-medium text-foreground">
                    {formatPrice(commerceConfig.freeShippingThreshold)}
                  </strong>
                </li>
                <li>
                  Standard: {commerceConfig.shippingRates.standard.eta} ·{' '}
                  {formatPrice(commerceConfig.shippingRates.standard.price)}
                </li>
                <li>
                  Express: {commerceConfig.shippingRates.express.eta} ·{' '}
                  {formatPrice(commerceConfig.shippingRates.express.price)}
                </li>
                <li>14-day returns on unopened products</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <StructuredData data={[faqSchema([...FAQS]), breadcrumbSchema(trail)]} />
    </>
  );
}
