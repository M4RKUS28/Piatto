import { useState, useEffect, useRef } from 'react';
import { MoreVertical, FolderOpen, Trash2 } from 'lucide-react';

/**
 * RecipeCardMenu component displays a three-dot menu button for recipe cards
 * Positioned at the bottom right of the card
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
    <div className="absolute bottom-4 right-4 z-10" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-2 bg-white/90 backdrop-blur-sm rounded-full border border-[#F5F5F5] hover:bg-[#035035] hover:text-white transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label="Recipe options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-lg border border-[#F5F5F5] py-2">
          <button
            onClick={handleEditCollections}
            className="w-full px-4 py-3 text-left hover:bg-[#F5F5F5] transition-colors flex items-center gap-3"
          >
            <FolderOpen className="w-5 h-5 text-[#035035]" />
            <span className="text-[#2D2D2D] font-medium">Sammlung bearbeiten</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-medium">Rezept löschen</span>
          </button>
        </div>
      )}
    </div>
  );
}
