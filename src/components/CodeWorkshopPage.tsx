"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
}

export default function CodeWorkshopPage() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState("");

  const addSnippet = () => {
    if (title && code) {
      const newSnippet: CodeSnippet = {
        id: Date.now().toString(),
        title,
        code,
        language,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };
      setSnippets([...snippets, newSnippet]);
      setTitle("");
      setCode("");
      setTags("");
    }
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter((snippet) => snippet.id !== id));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Code Workshop</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Code Snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Snippet Title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
          />
          <Textarea
            placeholder="Paste your code here..."
            value={code}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setCode(e.target.value)
            }
            rows={10}
          />
          <Input
            placeholder="Language (e.g., javascript, python, java)"
            value={language}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLanguage(e.target.value)
            }
          />
          <Input
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTags(e.target.value)
            }
          />
          <Button onClick={addSnippet}>Add Snippet</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Code Snippets</h2>
        {snippets.length === 0 ? (
          <p className="text-gray-500">No snippets added yet.</p>
        ) : (
          snippets.map((snippet) => (
            <Card key={snippet.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{snippet.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {snippet.language}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSnippet(snippet.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  <code>{snippet.code}</code>
                </pre>
                {snippet.tags.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex flex-wrap gap-2">
                      {snippet.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
