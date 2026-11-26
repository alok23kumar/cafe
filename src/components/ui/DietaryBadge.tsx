"use client";

/**
 * Indian FSSAI-standard Veg (green square + dot) / Non-Veg (red square + dot) indicator.
 */
export function DietaryBadge({
  isVeg,
  showLabel = false,
}: {
  isVeg: boolean;
  showLabel?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
          isVeg ? "border-cafe-veg" : "border-cafe-nonveg"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isVeg ? "bg-cafe-veg" : "bg-cafe-nonveg"
          }`}
        />
      </span>
      {showLabel && (
        <span
          className={`text-[11px] font-medium ${
            isVeg ? "text-cafe-veg" : "text-cafe-nonveg"
          }`}
        >
          {isVeg ? "Veg" : "Non-Veg"}
        </span>
      )}
    </span>
  );
}
