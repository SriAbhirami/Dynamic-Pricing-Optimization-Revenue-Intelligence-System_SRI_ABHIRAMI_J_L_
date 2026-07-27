import {
  Brain,
  TrendingUp,
  Package,
  AlertTriangle,
} from "lucide-react";

function AIAssistant() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full">

      <div className="flex items-center gap-3 mb-6">

        <Brain className="text-blue-600" />

        <h2 className="text-xl font-bold">
          PricePilot AI Assistant
        </h2>

      </div>

      <div className="space-y-5">

        <div className="flex gap-3">
          <TrendingUp className="text-green-600 mt-1" />
          <p>
            Revenue is expected to increase by
            <strong> 18% </strong>
            this weekend.
          </p>
        </div>

        <div className="flex gap-3">
          <Package className="text-blue-600 mt-1" />
          <p>
            Product A inventory is running low.
          </p>
        </div>

        <div className="flex gap-3">
          <AlertTriangle className="text-orange-500 mt-1" />
          <p>
            Product C appears underpriced based on demand.
          </p>
        </div>

      </div>

    </div>
  );
}

export default AIAssistant;