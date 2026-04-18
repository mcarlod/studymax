'use client'

import { PricingTable } from "@clerk/nextjs";

export default function SubscriptionsPage() {
  return (
    <div className="container wrapper py-10">
      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Unlock more books, longer sessions, and advanced features with our flexible plans.
        </p>
      </div>
      
      <div className="flex justify-center clerk-pricing-container">
         <PricingTable />
      </div>

      <style jsx global>{`
        .clerk-pricing-container .cl-pricingTable {
          --cl-colors-primary: var(--primary);
          --cl-radius-card: var(--radius);
          background-color: transparent;
        }
        .clerk-pricing-container .cl-pricingTableCard {
           border: 1px solid var(--border);
           box-shadow: var(--shadow-soft);
        }
      `}</style>
    </div>
  );
}
