"use client";

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { API_BASE_URL } from '@/lib/api';

interface Section {
  id: number;
  key: string;
  type: string;
  order: number;
  active: boolean;
  settings: Record<string, any>;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
}

function SortableSection({ section, onEdit }: { section: Section; onEdit: (section: Section) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-move p-2 text-gray-400 hover:text-gray-600"
          >
            ⋮⋮
          </button>
          
          <div>
            <h3 className="font-semibold text-gray-900">
              {section.title || `${section.key} (${section.type})`}
            </h3>
            <p className="text-sm text-gray-500">
              {section.subtitle || `Section: ${section.key}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={section.active}
              onChange={() => {
                // Toggle active state
                const updatedSection = { ...section, active: !section.active };
                onEdit(updatedSection);
              }}
              className="mr-2"
            />
            Active
          </label>
          
          <button
            onClick={() => onEdit(section)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  section: Section | null;
  onSave: (section: Section) => void;
  onClose: () => void;
}

function EditModal({ section, onSave, onClose }: EditModalProps) {
  const [editedSection, setEditedSection] = useState<Section | null>(section);

  useEffect(() => {
    setEditedSection(section);
  }, [section]);

  if (!section || !editedSection) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Section: {section.key}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editedSection.title}
              onChange={(e) => setEditedSection({ ...editedSection, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <textarea
              value={editedSection.subtitle}
              onChange={(e) => setEditedSection({ ...editedSection, subtitle: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded h-20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Label
              </label>
              <input
                type="text"
                value={editedSection.cta_label}
                onChange={(e) => setEditedSection({ ...editedSection, cta_label: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA URL
              </label>
              <input
                type="text"
                value={editedSection.cta_href}
                onChange={(e) => setEditedSection({ ...editedSection, cta_href: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary CTA Label
              </label>
              <input
                type="text"
                value={editedSection.cta_secondary_label}
                onChange={(e) => setEditedSection({ ...editedSection, cta_secondary_label: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary CTA URL
              </label>
              <input
                type="text"
                value={editedSection.cta_secondary_href}
                onChange={(e) => setEditedSection({ ...editedSection, cta_secondary_href: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedSection.active}
                onChange={(e) => setEditedSection({ ...editedSection, active: e.target.checked })}
                className="mr-2"
              />
              Active
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedSection)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VisualHomepageEditor() {
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/auth/`, {
        credentials: 'include'
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadSections();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSections() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pages/home/sections/`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Send reorder request to API
        const order = reordered.map(item => item.id);
        fetch(`${API_BASE_URL}/api/admin/pages/home/sections/reorder/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ order })
        }).then(() => {
          // Refresh preview
          setPreviewKey(Date.now());
        });
        
        return reordered;
      });
    }
  }

  async function handleSaveSection(section: Section) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sections/${section.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(section)
      });

      if (res.ok) {
        const updatedSection = await res.json();
        setSections(sections.map(s => s.id === section.id ? updatedSection : s));
        setEditingSection(null);
        setPreviewKey(Date.now()); // Refresh preview
      }
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-4">
            Please log in to the Django admin first, then return to this page.
          </p>
          <a 
            href="/admin/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Django Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Left Panel - Section Editor */}
        <div className="w-96 bg-white border-r border-gray-200 p-6 h-screen overflow-y-auto">
          <h1 className="text-xl font-bold mb-6">Homepage Editor</h1>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={setEditingSection}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1">
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 className="text-lg font-semibold">Preview</h2>
          </div>
          <iframe
            src={`/en?preview=1&t=${previewKey}`}
            className="w-full h-full border-0"
            title="Homepage Preview"
          />
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        section={editingSection}
        onSave={handleSaveSection}
        onClose={() => setEditingSection(null)}
      />
    </div>
  );
}