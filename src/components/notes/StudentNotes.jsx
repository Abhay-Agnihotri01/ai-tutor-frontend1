import { useState, useRef, useEffect } from 'react';
import { Save, Edit3, Clock, Trash2, Palette, BookOpen, Eye, X, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentNotes = ({ videoId, courseId, currentTime, onClose, inline = false }) => {
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('text');
  const [textNote, setTextNote] = useState('');
  const svgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [paths, setPaths] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [brushColor, setBrushColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [viewModal, setViewModal] = useState({ isOpen: false, note: null });

  useEffect(() => {
    loadNotes();
  }, [videoId]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShapeDropdown && !event.target.closest('.relative')) {
        setShowShapeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShapeDropdown]);

  const loadNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notes/${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to load notes');
    }
  };

  const saveTextNote = async () => {
    if (!textNote.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          courseId,
          type: 'text',
          content: textNote,
          timestamp: Math.floor(currentTime)
        })
      });

      if (response.ok) {
        setTextNote('');
        loadNotes();
        toast.success('Note saved!');
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
    setLoading(false);
  };



  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadNotes();
        setViewModal({ isOpen: false, note: null });
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const getShapeEmoji = (type) => {
    const emojiMap = {
      // Arrows
      doubleArrow: '↔️', upArrow: '⬆️', downArrow: '⬇️', leftArrow: '⬅️',
      // Math & Symbols
      plus: '➕', minus: '➖', multiply: '✖️', divide: '➗', equals: '🟰', infinity: '♾️',
      // Communication
      exclamation: '❗', question: '❓', check: '✅', cross: '❌',
      // Technology
      computer: '💻', phone: '📱', monitor: '🖥️', keyboard: '⌨️', mouse: '🖱️', camera: '📷',
      // Nature & Weather
      sun: '☀️', moon: '🌙', cloud: '☁️', tree: '🌳', flower: '🌸', fire: '🔥',
      // Objects & Tools
      home: '🏠', car: '🚗', key: '🔑', lock: '🔒', hammer: '🔨', scissors: '✂️',
      // Emotions
      happy: '😊', sad: '😢', heart: '❤️', thumbsUp: '👍', thumbsDown: '👎', clap: '👏',
      // Business
      chart: '📊', graph: '📈', money: '💰', briefcase: '💼', building: '🏢', lightbulb: '💡'
    };
    return emojiMap[type] || '●';
  };

  const isPointInShape = (x, y, shape) => {
    const { type, startX, startY, endX, endY } = shape;
    
    if (type === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const distance = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      return distance <= radius + 10;
    }
    
    const bounds = getShapeBounds(shape);
    return x >= bounds.minX - 10 && x <= bounds.maxX + 10 && y >= bounds.minY - 10 && y <= bounds.maxY + 10;
  };
  
  const getShapeBounds = (shape) => {
    const { type, startX, startY, endX, endY } = shape;
    
    if (type === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      return {
        minX: startX - radius,
        maxX: startX + radius,
        minY: startY - radius,
        maxY: startY + radius
      };
    }
    
    return {
      minX: Math.min(startX, endX),
      maxX: Math.max(startX, endX),
      minY: Math.min(startY, endY),
      maxY: Math.max(startY, endY)
    };
  };
  
  const getResizeHandles = (shape) => {
    const bounds = getShapeBounds(shape);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    return [
      // Corner handles
      { x: bounds.minX, y: bounds.minY, cursor: 'nw-resize', handle: 'nw' },
      { x: bounds.maxX, y: bounds.minY, cursor: 'ne-resize', handle: 'ne' },
      { x: bounds.minX, y: bounds.maxY, cursor: 'sw-resize', handle: 'sw' },
      { x: bounds.maxX, y: bounds.maxY, cursor: 'se-resize', handle: 'se' },
      // Directional handles
      { x: centerX, y: bounds.minY, cursor: 'n-resize', handle: 'n' },
      { x: centerX, y: bounds.maxY, cursor: 's-resize', handle: 's' },
      { x: bounds.minX, y: centerY, cursor: 'w-resize', handle: 'w' },
      { x: bounds.maxX, y: centerY, cursor: 'e-resize', handle: 'e' }
    ];
  };
  
  const startResize = (e, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  };
  
  const handleResize = (e) => {
    if (!isResizing || !selectedShape || !resizeHandle) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        let newShape = { ...shape };
        
        switch (resizeHandle) {
          case 'nw':
            newShape.startX = x;
            newShape.startY = y;
            break;
          case 'ne':
            newShape.endX = x;
            newShape.startY = y;
            break;
          case 'sw':
            newShape.startX = x;
            newShape.endY = y;
            break;
          case 'se':
            newShape.endX = x;
            newShape.endY = y;
            break;
          case 'n':
            newShape.startY = y;
            break;
          case 's':
            newShape.endY = y;
            break;
          case 'w':
            newShape.startX = x;
            break;
          case 'e':
            newShape.endX = x;
            break;
        }
        
        setSelectedShape(newShape);
        return newShape;
      }
      return shape;
    }));
  };
  
  const stopResize = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };
  
  const handleDrag = (e) => {
    if (!isDragging || !selectedShape) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    
    const width = selectedShape.endX - selectedShape.startX;
    const height = selectedShape.endY - selectedShape.startY;
    
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        const newShape = {
          ...shape,
          startX: newX,
          startY: newY,
          endX: newX + width,
          endY: newY + height
        };
        setSelectedShape(newShape);
        return newShape;
      }
      return shape;
    }));
  };

  const clearCanvas = () => {
    setPaths([]);
    setShapes([]);
    setCurrentPath('');
    setCurrentShape(null);
    setSelectedShape(null);
    setIsDragging(false);
    setIsResizing(false);
  };



  const startDrawing = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on an existing shape (works with any tool)
    const clickedShape = shapes.find(shape => isPointInShape(x, y, shape));
    if (clickedShape) {
      setSelectedShape(clickedShape);
      // Start dragging the shape
      setIsDragging(true);
      setDragOffset({
        x: x - Math.min(clickedShape.startX, clickedShape.endX),
        y: y - Math.min(clickedShape.startY, clickedShape.endY)
      });
      return; // Don't start drawing if we clicked on a shape
    }
    
    // Handle selection tool
    if (tool === 'select') {
      setSelectedShape(null); // Clear selection if clicking on empty space
      return;
    }
    
    // Clear selection when starting to draw
    setSelectedShape(null);
    setIsDrawing(true);
    
    if (tool === 'pen') {
      setCurrentPath(`M ${x} ${y}`);
    } else {
      setStartPoint({ x, y });
    }
  };

  const draw = (e) => {
    if (isResizing) {
      handleResize(e);
      return;
    }
    
    if (isDragging && selectedShape) {
      handleDrag(e);
      return;
    }
    
    if (!isDrawing) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === 'pen') {
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
    } else if (startPoint) {
      setCurrentShape({
        type: tool,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: x,
        endY: y,
        color: brushColor,
        size: brushSize
      });
    }
  };

  const stopDrawing = () => {
    if (isResizing) {
      stopResize();
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    if (isDrawing) {
      if (tool === 'pen' && currentPath) {
        setPaths(prev => [...prev, {
          path: currentPath,
          color: brushColor,
          size: brushSize,
          id: Date.now()
        }]);
      } else if (currentShape) {
        setShapes(prev => [...prev, { ...currentShape, id: Date.now() }]);
      }
    }
    setIsDrawing(false);
    setCurrentPath('');
    setCurrentShape(null);
    setStartPoint(null);
  };
  

  
  const saveDrawingAsSVG = async () => {
    if (paths.length === 0 && shapes.length === 0 && !currentPath) {
      toast.error('Nothing to save');
      return;
    }

    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 800;
    canvas.height = canvasHeight;
    
    img.onload = async () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const dataURL = canvas.toDataURL();
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/notes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            videoId,
            courseId,
            type: 'drawing',
            content: dataURL,
            timestamp: Math.floor(currentTime)
          })
        });

        if (response.ok) {
          clearCanvas();
          loadNotes();
          toast.success('Drawing saved!');
        }
      } catch (error) {
        toast.error('Failed to save drawing');
      }
      setLoading(false);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (inline) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'text' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'theme-bg-secondary theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              Write Note
            </button>
            <button
              onClick={() => setActiveTab('drawing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'drawing' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'theme-bg-secondary theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
              }`}
            >
              <Palette className="w-4 h-4 inline mr-2" />
              Draw
            </button>
          </div>

          {activeTab === 'text' && (
            <div className="theme-bg-secondary p-4 rounded-lg">
              <div className="flex items-center text-sm theme-text-muted mb-3">
                <Clock className="w-4 h-4 mr-2" />
                <span>Note at {formatTime(Math.floor(currentTime))}</span>
              </div>
              <textarea
                value={textNote}
                onChange={(e) => setTextNote(e.target.value)}
                placeholder="Write your note about this part of the video..."
                className="w-full h-40 p-4 theme-card border theme-border rounded-lg text-sm resize-y theme-text-primary placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[10rem] max-h-[20rem]"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={saveTextNote}
                  disabled={loading || !textNote.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'drawing' && (
            <div className="theme-bg-secondary p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm theme-text-muted mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Drawing at {formatTime(Math.floor(currentTime))}</span>
                </div>
                <button 
                  onClick={clearCanvas} 
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Clear Canvas
                </button>
              </div>
              
              {/* Drawing Tools */}
              <div className="mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setTool('pen')}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        tool === 'pen' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 theme-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>✏️</span>
                      <span>Draw</span>
                    </button>
                    
                    <button
                      onClick={() => setTool('select')}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        tool === 'select' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 theme-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>👆</span>
                      <span>Select</span>
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowShapeDropdown(!showShapeDropdown)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                          ['rectangle', 'circle', 'line', 'arrow', 'triangle', 'star', 'ellipse', 'diamond', 'doubleArrow', 'upArrow', 'downArrow', 'leftArrow', 'plus', 'minus', 'multiply', 'divide', 'equals', 'infinity', 'speech', 'thought', 'exclamation', 'question', 'check', 'cross', 'computer', 'phone', 'monitor', 'keyboard', 'mouse', 'camera', 'sun', 'moon', 'cloud', 'tree', 'flower', 'fire', 'home', 'car', 'key', 'lock', 'hammer', 'scissors', 'happy', 'sad', 'heart', 'thumbsUp', 'thumbsDown', 'clap', 'chart', 'graph', 'money', 'briefcase', 'building', 'lightbulb'].includes(tool)
                            ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md' 
                            : 'bg-gray-100 dark:bg-gray-700 theme-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span>🔷</span>
                        <span>Shapes</span>
                        <span className="text-xs">▼</span>
                      </button>
                      
                      {showShapeDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-96 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50">
                          <div className="p-4 space-y-4">
                            {/* Basic Shapes */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Basic Shapes</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'rectangle', icon: '⬜', label: 'Rectangle' },
                                  { tool: 'circle', icon: '⭕', label: 'Circle' },
                                  { tool: 'ellipse', icon: '🥚', label: 'Ellipse' },
                                  { tool: 'triangle', icon: '🔺', label: 'Triangle' },
                                  { tool: 'diamond', icon: '💎', label: 'Diamond' },
                                  { tool: 'star', icon: '⭐', label: 'Star' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Lines & Arrows */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Lines & Arrows</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'line', icon: '📏', label: 'Line' },
                                  { tool: 'arrow', icon: '➡️', label: 'Arrow' },
                                  { tool: 'doubleArrow', icon: '↔️', label: 'Double Arrow' },
                                  { tool: 'upArrow', icon: '⬆️', label: 'Up Arrow' },
                                  { tool: 'downArrow', icon: '⬇️', label: 'Down Arrow' },
                                  { tool: 'leftArrow', icon: '⬅️', label: 'Left Arrow' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Symbols & Math */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Symbols & Math</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'plus', icon: '➕', label: 'Plus' },
                                  { tool: 'minus', icon: '➖', label: 'Minus' },
                                  { tool: 'multiply', icon: '✖️', label: 'Multiply' },
                                  { tool: 'divide', icon: '➗', label: 'Divide' },
                                  { tool: 'equals', icon: '🟰', label: 'Equals' },
                                  { tool: 'infinity', icon: '♾️', label: 'Infinity' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Communication */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Communication</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'speech', icon: '💬', label: 'Speech Bubble' },
                                  { tool: 'thought', icon: '💭', label: 'Thought Bubble' },
                                  { tool: 'exclamation', icon: '❗', label: 'Exclamation' },
                                  { tool: 'question', icon: '❓', label: 'Question' },
                                  { tool: 'check', icon: '✅', label: 'Check' },
                                  { tool: 'cross', icon: '❌', label: 'Cross' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Technology */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Technology</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'computer', icon: '💻', label: 'Computer' },
                                  { tool: 'phone', icon: '📱', label: 'Phone' },
                                  { tool: 'monitor', icon: '🖥️', label: 'Monitor' },
                                  { tool: 'keyboard', icon: '⌨️', label: 'Keyboard' },
                                  { tool: 'mouse', icon: '🖱️', label: 'Mouse' },
                                  { tool: 'camera', icon: '📷', label: 'Camera' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Nature & Weather */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Nature & Weather</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'sun', icon: '☀️', label: 'Sun' },
                                  { tool: 'moon', icon: '🌙', label: 'Moon' },
                                  { tool: 'cloud', icon: '☁️', label: 'Cloud' },
                                  { tool: 'tree', icon: '🌳', label: 'Tree' },
                                  { tool: 'flower', icon: '🌸', label: 'Flower' },
                                  { tool: 'fire', icon: '🔥', label: 'Fire' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Objects & Tools */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Objects & Tools</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'home', icon: '🏠', label: 'Home' },
                                  { tool: 'car', icon: '🚗', label: 'Car' },
                                  { tool: 'key', icon: '🔑', label: 'Key' },
                                  { tool: 'lock', icon: '🔒', label: 'Lock' },
                                  { tool: 'hammer', icon: '🔨', label: 'Hammer' },
                                  { tool: 'scissors', icon: '✂️', label: 'Scissors' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Emotions */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Emotions</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'happy', icon: '😊', label: 'Happy' },
                                  { tool: 'sad', icon: '😢', label: 'Sad' },
                                  { tool: 'heart', icon: '❤️', label: 'Heart' },
                                  { tool: 'thumbsUp', icon: '👍', label: 'Thumbs Up' },
                                  { tool: 'thumbsDown', icon: '👎', label: 'Thumbs Down' },
                                  { tool: 'clap', icon: '👏', label: 'Clap' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Business */}
                            <div>
                              <h4 className="text-sm font-semibold theme-text-primary mb-2">Business</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { tool: 'chart', icon: '📊', label: 'Chart' },
                                  { tool: 'graph', icon: '📈', label: 'Graph Up' },
                                  { tool: 'money', icon: '💰', label: 'Money' },
                                  { tool: 'briefcase', icon: '💼', label: 'Briefcase' },
                                  { tool: 'building', icon: '🏢', label: 'Building' },
                                  { tool: 'lightbulb', icon: '💡', label: 'Lightbulb' }
                                ].map(({ tool: toolName, icon, label }) => (
                                  <button
                                    key={toolName}
                                    onClick={() => { setTool(toolName); setShowShapeDropdown(false); }}
                                    className={`p-2 rounded-lg text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                      tool === toolName ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                                    }`}
                                    title={label}
                                  >
                                    <div className="text-lg">{icon}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={clearCanvas} 
                      className="px-3 py-2 text-sm rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-all duration-200 flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium theme-text-secondary">Brush Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border-2 theme-border cursor-pointer shadow-sm"
                      />
                      <div className="flex space-x-2">
                        {['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'].map(color => (
                          <button
                            key={color}
                            onClick={() => setBrushColor(color)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 shadow-sm ${
                              brushColor === color ? 'border-white ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium theme-text-secondary">Brush Size: {brushSize}px</label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs theme-text-muted border border-gray-200 dark:border-gray-600">
                    {paths.length + shapes.length} elements
                  </div>
                </div>
                
                <svg
                  ref={svgRef}
                  width="100%"
                  height={canvasHeight}
                  className={isDragging ? 'cursor-move' : (tool === 'select' ? 'cursor-pointer' : 'cursor-crosshair')}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                >
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {paths.map((pathData) => (
                    <path
                      key={pathData.id}
                      d={pathData.path}
                      stroke={pathData.color}
                      strokeWidth={pathData.size}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                  ))}
                  
                  {shapes.map((shape) => {
                    const { type, startX, startY, endX, endY, color, size } = shape;
                    const width = endX - startX;
                    const height = endY - startY;
                    const centerX = startX + width / 2;
                    const centerY = startY + height / 2;
                    
                    switch (type) {
                      case 'rectangle':
                        return (
                          <rect
                            key={shape.id}
                            x={Math.min(startX, endX)}
                            y={Math.min(startY, endY)}
                            width={Math.abs(width)}
                            height={Math.abs(height)}
                            stroke={color}
                            strokeWidth={size}
                            fill="none"
                            className="drop-shadow-sm"
                          />
                        );
                      case 'circle':
                        const radius = Math.sqrt(width * width + height * height) / 2;
                        return (
                          <circle
                            key={shape.id}
                            cx={startX}
                            cy={startY}
                            r={radius}
                            stroke={color}
                            strokeWidth={size}
                            fill="none"
                            className="drop-shadow-sm"
                          />
                        );
                      case 'line':
                        return (
                          <line
                            key={shape.id}
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke={color}
                            strokeWidth={size}
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />
                        );
                      case 'arrow':
                        const angle = Math.atan2(endY - startY, endX - startX);
                        const arrowLength = 15;
                        const arrowAngle = Math.PI / 6;
                        return (
                          <g key={shape.id} className="drop-shadow-sm">
                            <line
                              x1={startX}
                              y1={startY}
                              x2={endX}
                              y2={endY}
                              stroke={color}
                              strokeWidth={size}
                              strokeLinecap="round"
                            />
                            <path
                              d={`M ${endX} ${endY} L ${endX - arrowLength * Math.cos(angle - arrowAngle)} ${endY - arrowLength * Math.sin(angle - arrowAngle)} M ${endX} ${endY} L ${endX - arrowLength * Math.cos(angle + arrowAngle)} ${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
                              stroke={color}
                              strokeWidth={size}
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      case 'triangle':
                        return (
                          <path
                            key={shape.id}
                            d={`M ${centerX} ${startY} L ${startX} ${endY} L ${endX} ${endY} Z`}
                            stroke={color}
                            strokeWidth={size}
                            fill="none"
                            className="drop-shadow-sm"
                          />
                        );
                      case 'star':
                        const spikes = 5;
                        const outerRadius = Math.abs(width) / 2;
                        const innerRadius = outerRadius * 0.4;
                        let starPath = '';
                        for (let i = 0; i < spikes * 2; i++) {
                          const radius = i % 2 === 0 ? outerRadius : innerRadius;
                          const angle = (i * Math.PI) / spikes - Math.PI / 2;
                          const x = centerX + radius * Math.cos(angle);
                          const y = centerY + radius * Math.sin(angle);
                          starPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
                        }
                        starPath += ' Z';
                        return (
                          <path
                            key={shape.id}
                            d={starPath}
                            stroke={color}
                            strokeWidth={size}
                            fill="none"
                            className="drop-shadow-sm"
                          />
                        );
                      default:
                        // For all other shapes, render as emoji
                        return (
                          <text
                            key={shape.id}
                            x={centerX}
                            y={centerY}
                            fontSize={Math.max(16, Math.abs(width) / 4)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={color}
                            className="drop-shadow-sm select-none"
                          >
                            {getShapeEmoji(type)}
                          </text>
                        );
                    }
                  })}
                  
                  {currentPath && (
                    <path
                      d={currentPath}
                      stroke={brushColor}
                      strokeWidth={brushSize}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                  )}
                  
                  {currentShape && (
                    (() => {
                      const { type, startX, startY, endX, endY, color, size } = currentShape;
                      const width = endX - startX;
                      const height = endY - startY;
                      const centerX = startX + width / 2;
                      const centerY = startY + height / 2;
                      
                      switch (type) {
                        case 'rectangle':
                          return (
                            <rect
                              x={Math.min(startX, endX)}
                              y={Math.min(startY, endY)}
                              width={Math.abs(width)}
                              height={Math.abs(height)}
                              stroke={color}
                              strokeWidth={size}
                              fill="none"
                              opacity="0.7"
                            />
                          );
                        case 'circle':
                          const radius = Math.sqrt(width * width + height * height) / 2;
                          return (
                            <circle
                              cx={startX}
                              cy={startY}
                              r={radius}
                              stroke={color}
                              strokeWidth={size}
                              fill="none"
                              opacity="0.7"
                            />
                          );
                        case 'line':
                          return (
                            <line
                              x1={startX}
                              y1={startY}
                              x2={endX}
                              y2={endY}
                              stroke={color}
                              strokeWidth={size}
                              strokeLinecap="round"
                              opacity="0.7"
                            />
                          );
                        case 'arrow':
                          const angle = Math.atan2(endY - startY, endX - startX);
                          const arrowLength = 15;
                          const arrowAngle = Math.PI / 6;
                          return (
                            <g opacity="0.7">
                              <line
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke={color}
                                strokeWidth={size}
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${endX} ${endY} L ${endX - arrowLength * Math.cos(angle - arrowAngle)} ${endY - arrowLength * Math.sin(angle - arrowAngle)} M ${endX} ${endY} L ${endX - arrowLength * Math.cos(angle + arrowAngle)} ${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
                                stroke={color}
                                strokeWidth={size}
                                strokeLinecap="round"
                              />
                            </g>
                          );
                        case 'triangle':
                          return (
                            <path
                              d={`M ${centerX} ${startY} L ${startX} ${endY} L ${endX} ${endY} Z`}
                              stroke={color}
                              strokeWidth={size}
                              fill="none"
                              opacity="0.7"
                            />
                          );
                        case 'star':
                          const spikes = 5;
                          const outerRadius = Math.abs(width) / 2;
                          const innerRadius = outerRadius * 0.4;
                          let starPath = '';
                          for (let i = 0; i < spikes * 2; i++) {
                            const radius = i % 2 === 0 ? outerRadius : innerRadius;
                            const angle = (i * Math.PI) / spikes - Math.PI / 2;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            starPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
                          }
                          starPath += ' Z';
                          return (
                            <path
                              d={starPath}
                              stroke={color}
                              strokeWidth={size}
                              fill="none"
                              opacity="0.7"
                            />
                          );
                        default:
                          // For preview of emoji shapes
                          return (
                            <text
                              x={centerX}
                              y={centerY}
                              fontSize={Math.max(16, Math.abs(width) / 4)}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={color}
                              opacity="0.7"
                              className="select-none"
                            >
                              {getShapeEmoji(type)}
                            </text>
                          );
                      }
                    })()
                  )}
                  
                  {/* Selection and resize handles */}
                  {selectedShape && (
                    <g>
                      {/* Selection outline */}
                      {(() => {
                        const bounds = getShapeBounds(selectedShape);
                        return (
                          <rect
                            x={bounds.minX - 5}
                            y={bounds.minY - 5}
                            width={bounds.maxX - bounds.minX + 10}
                            height={bounds.maxY - bounds.minY + 10}
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                            fill="none"
                            opacity="0.7"
                          />
                        );
                      })()}
                      
                      {/* Resize handles */}
                      {getResizeHandles(selectedShape).map((handle, index) => (
                        <rect
                          key={index}
                          x={handle.x - 4}
                          y={handle.y - 4}
                          width="8"
                          height="8"
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth="1"
                          className="cursor-pointer hover:fill-blue-600"
                          onMouseDown={(e) => startResize(e, handle.handle)}
                        />
                      ))}
                    </g>
                  )}
                </svg>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={saveDrawingAsSVG}
                  disabled={loading || (paths.length === 0 && shapes.length === 0 && !currentPath)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg transform hover:scale-105"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Drawing'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Saved Notes Preview */}
        {notes.length > 0 && (
          <div className="mt-8 border-t theme-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold theme-text-primary">Recent Notes ({notes.length})</h4>
              <span className="text-sm theme-text-muted">Click to view</span>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {notes.slice(0, 6).map((note) => (
                <button
                  key={note.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Note clicked:', note.id);
                    setViewModal({ isOpen: true, note });
                  }}
                  className="theme-card p-3 rounded-lg border theme-border hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 theme-text-muted" />
                      <span className="text-xs theme-text-muted font-medium">
                        {formatTime(note.timestamp)}
                      </span>
                    </div>
                    <Eye className="w-3 h-3 theme-text-muted group-hover:text-primary-500" />
                  </div>
                  {note.type === 'text' ? (
                    <p className="text-xs theme-text-secondary line-clamp-2">
                      {note.content}
                    </p>
                  ) : (
                    <div className="w-full h-12 overflow-hidden rounded border theme-border">
                      <img 
                        src={note.content} 
                        alt="Drawing" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {notes.length > 6 && (
              <p className="text-xs theme-text-muted text-center mt-3">
                +{notes.length - 6} more notes
              </p>
            )}
          </div>
        )}
        
        {/* View Note Modal */}
        {viewModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b theme-border">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 theme-text-muted" />
                  <span className="text-sm theme-text-muted font-medium">
                    At {formatTime(viewModal.note.timestamp)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    viewModal.note.type === 'text' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  }`}>
                    {viewModal.note.type === 'text' ? '📝 Text' : '🎨 Drawing'}
                  </span>
                </div>
                <button
                  onClick={() => setViewModal({ isOpen: false, note: null })}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {viewModal.note.type === 'text' ? (
                  <div className="theme-bg-secondary p-4 rounded-lg">
                    <p className="theme-text-primary leading-relaxed whitespace-pre-wrap">
                      {viewModal.note.content}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <img 
                      src={viewModal.note.content} 
                      alt="Drawing" 
                      className="max-w-full h-auto rounded-lg border theme-border mx-auto" 
                    />
                  </div>
                )}
              </div>
              <div className="p-4 border-t theme-border flex justify-end space-x-2">
                <button
                  onClick={() => deleteNote(viewModal.note.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
                <button
                  onClick={() => setViewModal({ isOpen: false, note: null })}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">My Notes</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="flex h-96">
          <div className="w-1/2 border-r p-4">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded text-sm ${activeTab === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Edit3 className="w-4 h-4 inline mr-1" />
                Text Note
              </button>
              <button
                onClick={() => setActiveTab('drawing')}
                className={`px-3 py-1 rounded text-sm ${activeTab === 'drawing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Drawing
              </button>
            </div>

            {activeTab === 'text' && (
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  At {formatTime(Math.floor(currentTime))}
                </div>
                <textarea
                  value={textNote}
                  onChange={(e) => setTextNote(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full h-48 p-3 border rounded resize-none"
                />
                <button
                  onClick={saveTextNote}
                  disabled={loading || !textNote.trim()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save Note
                </button>
              </div>
            )}

            {activeTab === 'drawing' && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>
                    <Clock className="w-4 h-4 inline mr-1" />
                    At {formatTime(Math.floor(currentTime))}
                  </span>
                  <button onClick={clearCanvas} className="text-red-500 hover:text-red-700">
                    Clear
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={200}
                  className="border rounded cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <button
                  onClick={saveDrawing}
                  disabled={loading}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save Drawing
                </button>
              </div>
            )}
          </div>

          <div className="w-1/2 p-4 overflow-y-auto">
            <h4 className="font-medium mb-3">Saved Notes</h4>
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTime(note.timestamp)}
                      </span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {note.type === 'text' ? (
                      <p className="text-sm">{note.content}</p>
                    ) : (
                      <img src={note.content} alt="Drawing" className="max-w-full h-auto" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotes;