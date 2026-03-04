import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AltTextDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialText: string;
    onSave: (text: string) => void;
}

export function AltTextDialog({ open, onOpenChange, initialText, onSave }: AltTextDialogProps) {
    const [text, setText] = useState(initialText);

    useEffect(() => {
        setText(initialText);
    }, [initialText, open]);

    const handleSave = () => {
        onSave(text);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add a description</DialogTitle>
                    <DialogDescription>
                        Alt text helps people with visual impairments understand the image. The text will also appear in place of the image if it fails to load.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a description for people with visual impairments"
                        className="h-[200px] resize-none"
                        maxLength={4000}
                    />
                    <div className="text-right text-sm text-gray-500 mt-2">
                        {text.length}/4000
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
