import CalculatorDetailClient from './calculator-detail-client';

export function generateStaticParams() {
  return [
    { slug: 'spot-arbitrage' },
    { slug: 'gross-spread' },
    { slug: 'net-spread' },
    { slug: 'triangular-arbitrage' },
    { slug: 'cross-chain' },
    { slug: 'funding-rate' },
    { slug: 'opportunity-simulator' },
  ];
}

export default async function CalculatorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <CalculatorDetailClient slug={resolvedParams.slug} />;
}
