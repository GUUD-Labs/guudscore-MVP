import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';

import { useOrderById } from '@/hooks';

const orderStatusSearchSchema = z.object({
  orderId: z.string().optional(),
});

// Order progress steps
const ORDER_STEPS = [
  {
    id: 1,
    status: 'pending',
    label: 'Order Placed',
    description: 'Your order has been received and is being processed',
  },
  {
    id: 2,
    status: 'confirmed',
    label: 'Confirmed',
    description: 'Order confirmed and payment verified',
  },
  {
    id: 3,
    status: 'processing',
    label: 'Processing',
    description: 'Your card is being printed and prepared',
  },
  {
    id: 4,
    status: 'shipped',
    label: 'Shipped',
    description: 'Your order is on the way',
  },
  {
    id: 5,
    status: 'delivered',
    label: 'Delivered',
    description: 'Order has been delivered successfully',
  },
];

export const Route = createFileRoute('/shop/order-status')({
  component: RouteComponent,
  validateSearch: orderStatusSearchSchema,
});

function RouteComponent() {
  const { orderId } = Route.useSearch();

  // Fetch order data if orderId is provided
  const { data: order, isLoading } = useOrderById(orderId || '');

  // Use order status from API, fallback to 'processing' for demo
  const currentStatus = order?.status || 'processing';
  const currentStepIndex = ORDER_STEPS.findIndex(
    step => step.status === currentStatus
  );

  const getStepVariant = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const getStepColor = (variant: string) => {
    switch (variant) {
      case 'completed':
        return 'bg-primary';
      case 'active':
        return 'bg-primary';
      case 'pending':
      default:
        return 'bg-muted';
    }
  };

  const getStepOpacity = (variant: string) => {
    return variant === 'pending' ? 'opacity-40' : 'opacity-100';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="font-pixel text-xl">Loading order status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 md:mb-12">
        <h4 className="font-pixel text-center text-xl md:text-2xl">
          ORDER STATUS
        </h4>
        {order && (
          <p className="text-muted mt-2 text-center text-sm">
            Order ID: {order.orderId}
          </p>
        )}
      </div>

      {/* Mobile: Vertical Layout */}
      <div className="relative md:hidden">
        <div className="relative flex flex-col gap-6">
          {/* Vertical Progress Line */}
          <div className="bg-muted absolute top-0 bottom-0 left-[5px] w-1">
            <div
              className="bg-primary w-full transition-all duration-500"
              style={{
                height: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {ORDER_STEPS.map((step, index) => {
            const variant = getStepVariant(index);
            const stepColor = getStepColor(variant);
            const stepOpacity = getStepOpacity(variant);

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 transition-opacity duration-300`}
              >
                {/* Step Circle */}
                <div
                  className={`z-10 flex size-3.5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${stepColor}`}
                />

                {/* Step Label & Description */}
                <div className={`flex flex-col gap-2 ${stepOpacity}`}>
                  <span className="glass w-fit rounded-md px-3 py-1.5 text-xs font-medium select-none">
                    {step.label}
                  </span>
                  <p className="text-muted !mt-0 text-xs leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="relative hidden md:block">
        <div className="relative grid grid-cols-5 gap-2">
          {/* Horizontal Progress Line */}
          <div className="bg-muted absolute top-[5px] right-[10%] left-[10%] h-1">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{
                width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {ORDER_STEPS.map((step, index) => {
            const variant = getStepVariant(index);
            const stepColor = getStepColor(variant);
            const stepOpacity = getStepOpacity(variant);

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-4 transition-opacity duration-300`}
              >
                {/* Step Circle */}
                <div
                  className={`z-10 flex size-3.5 items-center justify-center rounded-full transition-all duration-300 ${stepColor}`}
                />

                {/* Step Label & Description */}
                <div
                  className={`flex flex-col items-center text-center ${stepOpacity}`}
                >
                  <span className="glass rounded-md px-3 py-1.5 text-xs font-medium select-none">
                    {step.label}
                  </span>
                  <p className="text-muted text-xs leading-tight text-balance">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
