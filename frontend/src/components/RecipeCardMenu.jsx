import { useState, useEffect, useRef } from 'react';
import { MoreVertical, FolderOpen, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next'

/**
 * RecipeCardMenu component displays a three-dot menu button for recipe cards
 * Positioned where parent decides (usually top-right now)
 */
export default function RecipeCardMenu({ recipeId, onEditCollections, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleEditCollections = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onEditCollections(recipeId);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onDelete(recipeId);
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1.5 bg-white/95 backdrop-blur-sm rounded-full border border-[#F5F5F5] hover:bg-[#035035] hover:text-white transition-all shadow-md min-h-[28px] min-w-[28px] flex items-center justify-center"
        aria-label="Recipe options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#F5F5F5] py-1.5 z-50">
          <button
            onClick={handleEditCollections}
            className="w-full px-3 py-2 text-left hover:bg-[#F5F5F5] transition-colors flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4 text-[#035035]" />
            <span className="text-[#2D2D2D] font-medium text-sm">Sammlung bearbeiten</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-red-500 font-medium text-sm">Rezept löschen</span>
          </button>
        </div>
      )}
    </div>
  );
}
