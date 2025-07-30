// src/app/faculty/course-offerings/[courseOfferingId]/materials/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import { Loader2, PlusCircle, Edit2, Trash2, ExternalLink, Download, ArrowLeft, BookOpenCheck} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseMaterialService } from '@/lib/api/courseMaterials';
import type { CourseMaterial, CourseOffering, CourseMaterialFileType } from '@/types/entities';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { format, parseISO } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';

const FILE_TYPE_OPTIONS: CourseMaterialFileType[] = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'link', 'video', 'image', 'other'];

export default function ManageCourseMaterialsPage() {
  const router = useRouter();
  const params = useParams();
  const courseOfferingId = params?.courseOfferingId as string;

  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFileType, setFormFileType] = useState<CourseMaterialFileType>('pdf');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formLinkUrl, setFormLinkUrl] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (!courseOfferingId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [offeringData, materialsData] = await Promise.all([
          courseOfferingService.getCourseOfferingById(courseOfferingId),
          courseMaterialService.getMaterialsByCourseOffering(courseOfferingId),
        ]);
        setCourseOffering(offeringData);
        setMaterials(materialsData);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load data." });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [courseOfferingId, toast]);

  const resetForm = () => {
    setFormTitle(''); setFormDescription(''); setFormFileType('pdf');
    setFormFile(null); setFormLinkUrl(''); setEditingMaterial(null);
  };

  const handleOpenForm = (material?: CourseMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormTitle(material.title);
      setFormDescription(material.description || '');
      setFormFileType(material.fileType);
      if(material.fileType === 'link') setFormLinkUrl(material.filePathOrUrl);
      // File cannot be pre-filled for editing, user must re-select if changing
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Title is required."});
      return;
    }
    if (formFileType === 'link' && !formLinkUrl.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "URL is required for link type."});
      return;
    }
    if (formFileType !== 'link' && !formFile && !editingMaterial) { // Require file for new non-link material
      toast({ variant: "destructive", title: "Validation Error", description: "File is required for this material type."});
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', formTitle.trim());
    formData.append('courseOfferingId', courseOfferingId);
    formData.append('description', formDescription.trim());
    formData.append('fileType', formFileType);
    if (formFileType === 'link') {
      formData.append('linkUrl', formLinkUrl.trim());
    } else if (formFile) {
      formData.append('file', formFile);
    }

    try {
      if (editingMaterial && editingMaterial.id) {
        // Updating file is usually a delete + new upload. For simplicity, we'll update metadata only.
        // If a new file is selected, it implies replacement, which requires more complex API logic (delete old, upload new).
        // Here, we'll just update the metadata fields. File updates are not directly supported by this simple PUT.
        await courseMaterialService.updateMaterial(editingMaterial.id, { title: formTitle.trim(), description: formDescription.trim(), fileType: formFileType });
        if(formFile){ // If a new file was selected for an existing material
            toast({title: "File Replacement Info", description: "To replace the file, please delete the old material and upload a new one.", duration: 7000});
        }
        toast({ title: "Material Updated", description: "Material details updated." });
      } else {
        await courseMaterialService.createMaterial(formData);
        toast({ title: "Material Uploaded", description: "New material added successfully." });
      }
      const updatedMaterials = await courseMaterialService.getMaterialsByCourseOffering(courseOfferingId);
      setMaterials(updatedMaterials);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    setIsSubmitting(true);
    try {
      await courseMaterialService.deleteMaterial(materialId);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast({ title: "Material Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!courseOffering) return <div className="text-center py-10 text-muted-foreground">Course Offering not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/faculty/my-courses')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Courses
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenCheck className="h-7 w-7" /> Manage Course Materials
          </CardTitle>
          <CardDescription>
            For Course Offering ID: {courseOffering.id} ({courseOffering.academicYear} Sem {courseOffering.semester})
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end mb-4">
                <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Material</Button>
            </div>
            {materials.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No materials uploaded yet for this course offering.</p>
            ) : (
                <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Uploaded On</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {materials.map(material => (
                            <TableRow key={material.id}>
                                <TableCell className="font-medium">{material.title}</TableCell>
                                <TableCell>{material.fileType.toUpperCase()}</TableCell>
                                <TableCell>{format(parseISO(material.uploadedAt), "PPP")}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenForm(material)}><Edit2 className="h-4 w-4"/></Button>
                                    <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteMaterial(material.id)}><Trash2 className="h-4 w-4"/></Button>
                                    {material.fileType !== 'link' && <a href={material.filePathOrUrl} target="_blank" rel="noopener noreferrer" download={material.fileName}><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-4 w-4"/></Button></a>}
                                    {material.fileType === 'link' && <a href={material.filePathOrUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-4 w-4"/></Button></a>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) resetForm();}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
            <DialogDescription>Add or edit course material details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div><Label htmlFor="formTitle">Title *</Label><Input id="formTitle" value={formTitle} onChange={e=>setFormTitle(e.target.value)} required/></div>
            <div><Label htmlFor="formDescription">Description</Label><Textarea id="formDescription" value={formDescription} onChange={e=>setFormDescription(e.target.value)} rows={3}/></div>
            <div><Label htmlFor="formFileType">File Type *</Label><Select value={formFileType} onValueChange={v => setFormFileType(v as CourseMaterialFileType)} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{FILE_TYPE_OPTIONS.map(t=><SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
            {formFileType === 'link' ? (
                 <div><Label htmlFor="formLinkUrl">Link URL *</Label><Input id="formLinkUrl" type="url" value={formLinkUrl} onChange={e=>setFormLinkUrl(e.target.value)} required placeholder="https://example.com/resource"/></div>
            ) : (
                 <div><Label htmlFor="formFile">{editingMaterial ? "Replace File (Optional)" : "Upload File *"}</Label><Input id="formFile" type="file" onChange={handleFileChange} /></div>
            )}
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={()=>setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editingMaterial ? "Save Changes" : "Add Material"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
