import { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Trash2, Loader2, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BucketListItem {
  id: string;
  item_text: string;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const CATEGORIES = ['Adventure', 'Career', 'Health', 'Learning', 'Relationships', 'Creative', 'Other'];

const BUCKET_LIST_QUOTES = [
  "\"The purpose of life is to live it, to taste experience to the utmost.\" — Eleanor Roosevelt",
  "\"Life is either a daring adventure or nothing at all.\" — Helen Keller",
  "\"Twenty years from now you will be more disappointed by the things you didn't do.\" — Mark Twain",
  "\"Dream big and dare to fail.\" — Norman Vaughan",
  "\"Go confidently in the direction of your dreams.\" — Henry David Thoreau",
];

export function BucketList() {
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchItems = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bucket_list')
        .select('*')
        .eq('user_id', user.id)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching bucket list:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (!user || !newItemText.trim()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('bucket_list')
        .insert({
          user_id: user.id,
          item_text: newItemText.trim(),
          category: selectedCategory || null,
        })
        .select()
        .single();

      if (error) throw error;
      setItems([data, ...items]);
      setNewItemText('');
      setSelectedCategory('');
      toast({
        title: "Dream added!",
        description: "\"A goal is a dream with a deadline.\" — Napoleon Hill",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (item: BucketListItem) => {
    setIsSaving(true);
    try {
      const newCompleted = !item.completed;
      const { error } = await supabase
        .from('bucket_list')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', item.id);

      if (error) throw error;

      setItems(items.map(i => 
        i.id === item.id ? { ...i, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : i
      ));

      if (newCompleted) {
        toast({
          title: "🎉 Dream achieved!",
          description: "\"Success is not the key to happiness. Happiness is the key to success.\" — Albert Schweitzer",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bucket_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);
  const randomQuote = BUCKET_LIST_QUOTES[Math.floor(Math.random() * BUCKET_LIST_QUOTES.length)];

  return (
    <Card className="bg-card border-2 border-gold/20 shadow-parchment">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl text-burgundy">
          <Star className="w-6 h-6 text-gold fill-gold/30" />
          Year's Bucket List
        </CardTitle>
        <CardDescription className="italic text-muted-foreground">
          {randomQuote}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new item */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="What dream will you chase this year?"
              className="bg-parchment/50 border-border focus:border-gold"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button
              onClick={handleAddItem}
              disabled={isSaving || !newItemText.trim()}
              className="bg-gradient-to-r from-burgundy to-burgundy-light hover:shadow-gold shrink-0"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  selectedCategory === cat 
                    ? 'bg-burgundy text-white' 
                    : 'hover:border-burgundy hover:text-burgundy'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Active items */}
            <div className="space-y-2">
              {activeItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 italic">
                  No dreams yet. What will make this year unforgettable?
                </p>
              ) : (
                activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-parchment/30 rounded-lg group hover:bg-parchment/50 transition-colors"
                  >
                    <Checkbox
                      id={`bucket-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={() => handleToggleComplete(item)}
                      className="border-gold data-[state=checked]:bg-gold"
                    />
                    <label
                      htmlFor={`bucket-${item.id}`}
                      className="font-body text-foreground cursor-pointer flex-1"
                    >
                      {item.item_text}
                    </label>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Completed items */}
            {completedItems.length > 0 && (
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                  {showCompleted ? 'Hide' : 'Show'} {completedItems.length} achieved dream{completedItems.length !== 1 ? 's' : ''}
                </button>
                {showCompleted && (
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gold/10 rounded-lg"
                      >
                        <Check className="w-5 h-5 text-gold" />
                        <span className="font-body text-muted-foreground line-through flex-1">
                          {item.item_text}
                        </span>
                        {item.category && (
                          <Badge variant="secondary" className="text-xs opacity-50">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Progress summary */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-gold font-semibold">{completedItems.length}</span> of{' '}
              <span className="font-semibold">{items.length}</span> dreams achieved
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
