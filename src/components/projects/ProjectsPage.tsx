import { useState } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Edit2,
  X,
  Save,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ProjectFile } from '@/types/diary';

const initialFiles: ProjectFile[] = [
  {
    id: '1',
    name: 'Personal Writings',
    type: 'folder',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      { id: '1-1', name: 'Sonnets', type: 'folder', createdAt: new Date(), updatedAt: new Date(), children: [] },
      { id: '1-2', name: 'Reflections on Life', type: 'note', content: 'To be, or not to be...', createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '2',
    name: 'Project Ideas',
    type: 'folder',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      { id: '2-1', name: 'The Great Work', type: 'note', content: 'Plans for my magnum opus...', createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '3',
    name: 'Quick Notes',
    type: 'note',
    content: 'Remember to tend to daily affairs.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface FileItemProps {
  file: ProjectFile;
  depth: number;
  onSelect: (file: ProjectFile) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

function FileItem({ file, depth, onSelect, onDelete, selectedId }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = file.type === 'folder';
  const hasChildren = isFolder && file.children && file.children.length > 0;

  const Icon = isFolder ? Folder : file.type === 'note' ? FileText : File;
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all",
          selectedId === file.id
            ? "bg-burgundy/10 border border-burgundy/30"
            : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          }
          onSelect(file);
        }}
      >
        {isFolder && (
          <ChevronIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        {!isFolder && <div className="w-4" />}
        
        <Icon className={cn(
          "w-5 h-5 flex-shrink-0",
          isFolder ? "text-gold" : "text-burgundy"
        )} />
        
        <span className="font-body text-foreground truncate flex-grow">
          {file.name}
        </span>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {isOpen && hasChildren && (
        <div className="animate-fade-in">
          {file.children!.map(child => (
            <FileItem
              key={child.id}
              file={child}
              depth={depth + 1}
              onSelect={onSelect}
              onDelete={onDelete}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsPage() {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'folder' | 'note'>('note');
  const { toast } = useToast();

  const handleSelect = (file: ProjectFile) => {
    setSelectedFile(file);
    setEditContent(file.content || '');
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    const deleteFromTree = (items: ProjectFile[]): ProjectFile[] => {
      return items
        .filter(item => item.id !== id)
        .map(item => ({
          ...item,
          children: item.children ? deleteFromTree(item.children) : undefined,
        }));
    };
    
    setFiles(deleteFromTree(files));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    toast({
      title: "Item removed",
      description: "Your archives have been updated.",
    });
  };

  const handleSaveContent = () => {
    if (!selectedFile) return;
    
    const updateInTree = (items: ProjectFile[]): ProjectFile[] => {
      return items.map(item => {
        if (item.id === selectedFile.id) {
          return { ...item, content: editContent, updatedAt: new Date() };
        }
        if (item.children) {
          return { ...item, children: updateInTree(item.children) };
        }
        return item;
      });
    };
    
    setFiles(updateInTree(files));
    setSelectedFile({ ...selectedFile, content: editContent });
    setIsEditing(false);
    toast({
      title: "Content saved!",
      description: "Your work has been preserved.",
    });
  };

  const addNewItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: ProjectFile = {
      id: Date.now().toString(),
      name: newItemName,
      type: newItemType,
      content: newItemType === 'note' ? '' : undefined,
      children: newItemType === 'folder' ? [] : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setFiles(prev => [...prev, newItem]);
    setNewItemName('');
    toast({
      title: `${newItemType === 'folder' ? 'Folder' : 'Note'} created!`,
      description: "New item added to your archive.",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* File Tree */}
        <Card className="lg:col-span-1 bg-card border-2 border-gold/20 shadow-parchment">
          <CardHeader className="pb-2">
            <h3 className="font-display text-lg text-foreground">Projects</h3>
            <p className="text-sm text-muted-foreground font-body italic">
              "Your collection of ideas and work"
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Item */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="New item name..."
                  className="font-body text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newItemType === 'folder' ? 'default' : 'outline'}
                  onClick={() => setNewItemType('folder')}
                  className="flex-1"
                >
                  <Folder className="w-4 h-4 mr-1" />
                  Folder
                </Button>
                <Button
                  size="sm"
                  variant={newItemType === 'note' ? 'default' : 'outline'}
                  onClick={() => setNewItemType('note')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Note
                </Button>
                <Button
                  size="sm"
                  onClick={addNewItem}
                  className="bg-gradient-to-r from-burgundy to-burgundy-light"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* File Tree */}
            <div className="border-t border-border pt-4 -mx-4 px-2">
              {files.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  depth={0}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  selectedId={selectedFile?.id}
                />
              ))}
              {files.length === 0 && (
                <p className="text-center text-muted-foreground font-body italic py-4">
                  Your projects are empty. Create your first one above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content View */}
        <Card className="lg:col-span-2 bg-card border-2 border-gold/20 shadow-parchment">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-foreground">
                  {selectedFile?.name || 'Select an item'}
                </h3>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground font-body">
                    {selectedFile.type === 'folder' ? 'Folder' : 'Note'} • 
                    Updated {selectedFile.updatedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
              {selectedFile && selectedFile.type !== 'folder' && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSaveContent}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              selectedFile.type === 'folder' ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gold mx-auto mb-4" />
                  <p className="text-muted-foreground font-body">
                    This folder contains {selectedFile.children?.length || 0} items
                  </p>
                </div>
              ) : isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] font-body text-lg leading-relaxed bg-parchment/50"
                  placeholder="Inscribe thy thoughts herein..."
                />
              ) : (
                <div className="min-h-[400px] p-4 bg-parchment/30 rounded border border-border">
                  <p className="font-body text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedFile.content || (
                      <span className="text-muted-foreground italic">
                        This parchment awaits thy words...
                      </span>
                    )}
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-body text-lg">
                  Select an item from your projects to view its contents
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decorative Ornament */}
      <div className="h-8 ornament opacity-30 mt-8" />
    </div>
  );
}