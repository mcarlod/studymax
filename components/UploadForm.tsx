"use client";

import React, { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Image as ImageIcon, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadSchema } from "@/lib/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LoadingOverlay from "@/components/LoadingOverlay";

type FormValues = z.infer<typeof UploadSchema>;

const VOICES = {
  male: [
    { id: "dave", name: "Dave", desc: "Young male, British-Essex, casual & conversational" },
    { id: "daniel", name: "Daniel", desc: "Middle-aged male, British, authoritative but warm" },
    { id: "chris", name: "Chris", desc: "Male, casual & easy-going" },
  ],
  female: [
    { id: "rachel", name: "Rachel", desc: "Young female, American, calm & clear" },
    { id: "sarah", name: "Sarah", desc: "Young female, American, soft & approachable" },
  ],
};

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      voice: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    console.log(values);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSubmitting(false);
    alert("Book uploaded successfully!");
  };

  const pdfFile = useWatch({
    control: form.control,
    name: "pdfFile",
  });
  const coverImage = useWatch({
    control: form.control,
    name: "coverImage",
  });

  return (
    <div className="new-book-wrapper max-w-3xl mx-auto py-10">
      {isSubmitting && <LoadingOverlay />}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* PDF File Upload */}
          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Book PDF File</FormLabel>
                <FormControl>
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-[#8B7355]/30",
                      pdfFile && "upload-dropzone-uploaded"
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={pdfInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) field.onChange(file);
                      }}
                    />
                    {pdfFile ? (
                      <div className="flex flex-col items-center">
                        <Check className="upload-dropzone-icon text-green-600" />
                        <span className="upload-dropzone-text">{pdfFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="upload-dropzone-remove mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange(undefined);
                            if (pdfInputRef.current) pdfInputRef.current.value = "";
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">Click to upload PDF</span>
                        <span className="upload-dropzone-hint">PDF file (max 50MB)</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Image Upload */}
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Cover Image (Optional)</FormLabel>
                <FormControl>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-[#8B7355]/30",
                      coverImage && "upload-dropzone-uploaded"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={coverInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) field.onChange(file);
                      }}
                    />
                    {coverImage ? (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">{coverImage.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="upload-dropzone-remove mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange(undefined);
                            if (coverInputRef.current) coverInputRef.current.value = "";
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">Click to upload cover image</span>
                        <span className="upload-dropzone-hint">Leave empty to auto-generate from PDF</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title Input */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <Input
                    className="form-input"
                    placeholder="ex: Rich Dad Poor Dad"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Author Input */}
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <Input
                    className="form-input"
                    placeholder="ex: Robert Kiyosaki"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Voice Selector */}
          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-6"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-[#8B7355] mb-3 uppercase tracking-wider">Male Voices</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {VOICES.male.map((voice) => (
                          <div key={voice.id} className="relative">
                            <RadioGroupItem
                              value={voice.id}
                              id={voice.id}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={voice.id}
                              className={cn(
                                "voice-selector-option block p-4 rounded-xl border-2 cursor-pointer transition-all h-full",
                                field.value === voice.id
                                  ? "voice-selector-option-selected border-[#663820] bg-[#f3e4c7]"
                                  : "bg-white border-transparent hover:border-[#f3e4c7]"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border border-[#8B7355] flex items-center justify-center",
                                  field.value === voice.id && "bg-[#663820] border-[#663820]"
                                )}>
                                  {field.value === voice.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-[#222]">{voice.name}</span>
                              </div>
                              <p className="text-xs text-[#777] leading-relaxed">{voice.desc}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-[#8B7355] mb-3 uppercase tracking-wider">Female Voices</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {VOICES.female.map((voice) => (
                          <div key={voice.id} className="relative">
                            <RadioGroupItem
                              value={voice.id}
                              id={voice.id}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={voice.id}
                              className={cn(
                                "voice-selector-option block p-4 rounded-xl border-2 cursor-pointer transition-all h-full",
                                field.value === voice.id
                                  ? "voice-selector-option-selected border-[#663820] bg-[#f3e4c7]"
                                  : "bg-white border-transparent hover:border-[#f3e4c7]"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border border-[#8B7355] flex items-center justify-center",
                                  field.value === voice.id && "bg-[#663820] border-[#663820]"
                                )}>
                                  {field.value === voice.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-bold text-[#222]">{voice.name}</span>
                              </div>
                              <p className="text-xs text-[#777] leading-relaxed">{voice.desc}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="form-btn w-full h-14 text-white text-xl rounded-xl transition-all font-serif bg-[#663820] hover:bg-[#4d2a18]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Begin Synthesis"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UploadForm;
