"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableList({
  label,
  placeholder,
  items,
  renderItem,
  onAdd,
  onDelete,
  onOrderChange,
  showAdd = true,
  showDelete = true,
}: {
  label: string;
  placeholder: string;
  items: any[];
  renderItem?: (item: any, index: number) => React.ReactNode;
  onAdd: (value: string) => void;
  onDelete: (index: number, item: any) => void;
  onOrderChange: (order: number[]) => void;
  showAdd?: boolean;
  showDelete?: boolean;
}) {
  const [newItem, setNewItem] = useState("");

  // Use stable ids independent of item value to prevent remounts while editing
  const ids = useMemo(() => items.map((_, i) => `idx-${i}`), [items.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAdd = () => {
    const value = newItem.trim();
    if (!value) return;
    onAdd(value);
    setNewItem("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    // Build mapping: order[newIndex] = oldIndex after move
    const indexOrder = Array.from({ length: items.length }, (_, i) => i);
    const moved = arrayMove(indexOrder, oldIndex, newIndex);

    // moved array now represents newIndex -> oldIndex mapping
    onOrderChange(moved);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableRow
                  key={ids[index]}
                  id={ids[index]}
                  index={index}
                  onDelete={() => onDelete(index, item)}
                  showDelete={showDelete}
                  renderContent={
                    renderItem ? (
                      renderItem(item, index)
                    ) : (
                      <span>{String(item)}</span>
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableRow({
  id,
  index,
  onDelete,
  showDelete,
  renderContent,
}: {
  id: string;
  index: number;
  onDelete: () => void;
  showDelete: boolean;
  renderContent: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg group transition-all ${
        isDragging ? "opacity-40" : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          className="cursor-move text-gray-400 hover:text-gray-600 select-none"
          title="Drag to reorder"
          {...listeners}
          {...attributes}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
        <div className="text-sm text-gray-900 flex-1">{renderContent}</div>
      </div>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
          title="Remove item"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
