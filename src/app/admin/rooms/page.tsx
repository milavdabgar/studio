
"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, DoorOpen, Loader2, UploadCloud, Download, FileSpreadsheet, Search, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Room, Building, RoomType, RoomStatus } from '@/types/entities';
import { roomService } from '@/lib/services/roomService';
import { buildingService } from '@/lib/services/buildingService';


const ROOM_TYPE_OPTIONS: RoomType[] = ['Lecture Hall', 'Laboratory', 'Office', 'Staff Room', 'Workshop', 'Library', 'Store Room', 'Seminar Hall', 'Auditorium', 'Other'];
const ROOM_STATUS_OPTIONS: { value: RoomStatus, label: string }[] = [
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "under_maintenance", label: "Under Maintenance" },
    { value: "unavailable", label: "Unavailable" },
];


type SortField = keyof Room | 'none';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Partial<Room> | null>(null);

  // Form state
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formBuildingId, setFormBuildingId] = useState<string>('');
  const [formFloor, setFormFloor] = useState<number | undefined>(undefined);
  const [formType, setFormType] = useState<RoomType>('Lecture Hall');
  const [formCapacity, setFormCapacity] = useState<number | undefined>(undefined);
  const [formAreaSqFt, setFormAreaSqFt] = useState<number | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<RoomStatus>('available');
  const [formNotes, setFormNotes] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuildingVal, setFilterBuildingVal] = useState<string>('all');
  const [filterTypeVal, setFilterTypeVal] = useState<RoomType | 'all'>('all');
  const [filterStatusVal, setFilterStatusVal] = useState<RoomStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('roomNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]);

  const { toast } = useToast();

  const fetchRoomsAndBuildings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomData, buildingData] = await Promise.all([
        roomService.getAllRooms(),
        buildingService.getAllBuildings()
      ]);
      setRooms(roomData);
      setBuildings(buildingData);
      if (buildingData.length > 0 && !formBuildingId) {
        setFormBuildingId(buildingData[0].id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load rooms or buildings data." });
    }
    setIsLoading(false);
  }, [formBuildingId, toast]);

  useEffect(() => {
    fetchRoomsAndBuildings();
  }, [fetchRoomsAndBuildings]);

  const resetForm = () => {
    setFormRoomNumber(''); setFormName(''); 
    setFormBuildingId(buildings.length > 0 ? buildings[0].id : ''); 
    setFormFloor(undefined); setFormType('Lecture Hall'); setFormCapacity(undefined);
    setFormAreaSqFt(undefined); setFormStatus('available'); setFormNotes('');
    setCurrentRoom(null);
  };

  const handleEdit = (room: Room) => {
    setCurrentRoom(room);
    setFormRoomNumber(room.roomNumber);
    setFormName(room.name || '');
    setFormBuildingId(room.buildingId);
    setFormFloor(room.floor === null ? undefined : room.floor);
    setFormType(room.type);
    setFormCapacity(room.capacity === null ? undefined : room.capacity);
    setFormAreaSqFt(room.areaSqFt === null ? undefined : room.areaSqFt);
    setFormStatus(room.status);
    setFormNotes(room.notes || '');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
     if (buildings.length === 0) {
      toast({ variant: "destructive", title: "Cannot Add Room", description: "No buildings available. Please create a building first." });
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    setIsSubmitting(true);
    try {
      await roomService.deleteRoom(roomId);
      await fetchRoomsAndBuildings();
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
      toast({ title: "Room Deleted", description: "The room has been successfully deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete room." });
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formRoomNumber.trim() || !formBuildingId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Room Number and Building are required."});
      return;
    }
    const numericFields = {formFloor, formCapacity, formAreaSqFt};
    for (const [key, value] of Object.entries(numericFields)) {
        if (value !== undefined && (isNaN(value))) { 
            toast({ variant: "destructive", title: "Validation Error", description: `${key.replace('form','')} must be a valid number.` });
            return;
        }
         if (key !== 'formFloor' && value !== undefined && value < 0){
             toast({ variant: "destructive", title: "Validation Error", description: `${key.replace('form','')} must be a non-negative number.` });
            return;
         }
    }

    setIsSubmitting(true);
    
    const roomData: Omit<Room, 'id'> = { 
      roomNumber: formRoomNumber.trim().toUpperCase(), name: formName.trim() || undefined,
      buildingId: formBuildingId,
      floor: formFloor !== undefined ? Number(formFloor) : undefined,
      type: formType,
      capacity: formCapacity !== undefined ? Number(formCapacity) : undefined,
      areaSqFt: formAreaSqFt !== undefined ? Number(formAreaSqFt) : undefined,
      status: formStatus,
      notes: formNotes.trim() || undefined,
    };

    try {
      if (currentRoom && currentRoom.id) {
        await roomService.updateRoom(currentRoom.id, roomData);
        toast({ title: "Room Updated", description: "The room has been successfully updated." });
      } else {
        await roomService.createRoom(roomData);
        toast({ title: "Room Created", description: "The new room has been successfully created." });
      }
      await fetchRoomsAndBuildings();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message || "Could not save room." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleImportRooms = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "Import Error", description: "Please select a CSV file to import." });
      return;
    }
    if (buildings.length === 0) {
      toast({ variant: "destructive", title: "Import Error", description: "No buildings loaded. Cannot map building IDs." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await roomService.importRooms(selectedFile, buildings);
      await fetchRoomsAndBuildings();
      toast({ title: "Import Successful", description: `${result.newCount} rooms added, ${result.updatedCount} rooms updated. Skipped: ${result.skippedCount}` });
    } catch (error: unknown) {
      console.error("Error processing CSV file:", error);
      toast({ variant: "destructive", title: "Import Failed", description: (error as Error).message || "Could not process the CSV file." });
    } finally {
      setIsSubmitting(false); setSelectedFile(null); 
      const fileInput = document.getElementById('csvImportRoom') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleExportRooms = () => {
    if (filteredAndSortedRooms.length === 0) {
      toast({ title: "Export Canceled", description: "No rooms to export (check filters)." });
      return;
    }
    const header = ['id', 'roomNumber', 'name', 'buildingId', 'buildingName', 'buildingCode', 'floor', 'type', 'capacity', 'areaSqFt', 'status', 'notes'];
    const csvRows = [
      header.join(','),
      ...filteredAndSortedRooms.map(r => {
        const bldg = buildings.find(b => b.id === r.buildingId);
        return [
          r.id, r.roomNumber, `"${(r.name || "").replace(/"/g, '""')}"`, r.buildingId, 
          `"${(bldg?.name || "").replace(/"/g, '""')}"`, `"${(bldg?.code || "").replace(/"/g, '""')}"`,
          r.floor === undefined ? "" : r.floor, r.type, r.capacity === undefined ? "" : r.capacity,
          r.areaSqFt === undefined ? "" : r.areaSqFt, r.status, `"${(r.notes || "").replace(/"/g, '""')}"`
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rooms_export.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Rooms exported to rooms_export.csv" });
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsvContent = `id,roomNumber,name,buildingId,buildingName,buildingCode,floor,type,capacity,areaSqFt,status,notes
room_sample_1,C-101,Smart Classroom 1,bldg2,"New Academic Complex","NAC",1,Lecture Hall,50,800,available,"Projector and AC available"
,LAB-003,Network Lab,bldg2,"New Academic Complex","NAC",0,Laboratory,25,600,occupied,
`; 
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_rooms_import.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Sample CSV Downloaded", description: "sample_rooms_import.csv downloaded." });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field); setSortDirection('asc');
    }
    setCurrentPage(1); 
  };
  
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    if (searchTerm) {
      result = result.filter(r => 
        r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
     if (filterBuildingVal !== 'all') {
      result = result.filter(r => r.buildingId === filterBuildingVal);
    }
    if (filterTypeVal !== 'all') {
      result = result.filter(r => r.type === filterTypeVal);
    }
    if (filterStatusVal !== 'all') {
      result = result.filter(r => r.status === filterStatusVal);
    }


    if (sortField !== 'none') {
      result.sort((a, b) => {
        let valA: unknown = a[sortField as keyof Room];
        let valB: unknown = b[sortField as keyof Room];
        
        const numericFields: (keyof Room)[] = ['floor', 'capacity', 'areaSqFt'];
        if (numericFields.includes(sortField as keyof Room)) {
            valA = Number(valA) || 0; valB = Number(valB) || 0;
        }
        
        if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return result;
  }, [rooms, searchTerm, filterBuildingVal, filterTypeVal, filterStatusVal, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedRooms.length / itemsPerPage);
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRooms.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedRooms, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, filterBuildingVal, filterTypeVal, filterStatusVal, itemsPerPage]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedRoomIds(checked === true ? paginatedRooms.map(r => r.id) : []);
  };

  const handleSelectRoom = (roomId: string, checked: boolean) => {
    setSelectedRoomIds(prev => checked ? [...prev, roomId] : prev.filter(id => id !== roomId));
  };

  const handleDeleteSelected = async () => {
    if (selectedRoomIds.length === 0) {
      toast({ variant: "destructive", title: "No Rooms Selected", description: "Please select rooms to delete." });
      return;
    }
    setIsSubmitting(true);
    try {
        for (const id of selectedRoomIds) {
            await roomService.deleteRoom(id);
        }
        await fetchRoomsAndBuildings();
        toast({ title: "Rooms Deleted", description: `${selectedRoomIds.length} room(s) have been successfully deleted.` });
        setSelectedRoomIds([]);
    } catch(error) {
        toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message || "Could not delete selected rooms."});
    }
    setIsSubmitting(false);
  };
  
  const isAllSelectedOnPage = paginatedRooms.length > 0 && paginatedRooms.every(r => selectedRoomIds.includes(r.id));
  const isSomeSelectedOnPage = paginatedRooms.some(r => selectedRoomIds.includes(r.id)) && !isAllSelectedOnPage;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <DoorOpen className="h-6 w-6" />
              Room Management
            </CardTitle>
            <CardDescription>
              Manage rooms, labs, offices within buildings, their types, capacities, and status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="w-full sm:w-auto" disabled={buildings.length === 0}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{currentRoom?.id ? "Edit Room" : "Add New Room"}</DialogTitle>
                  <DialogDescription>
                    {currentRoom?.id ? "Modify room details." : "Create a new room record."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-1"><Label htmlFor="roomNumber">Room Number *</Label><Input id="roomNumber" value={formRoomNumber} onChange={e => setFormRoomNumber(e.target.value.toUpperCase())} placeholder="e.g., A-101" disabled={isSubmitting} required /></div>
                  <div className="md:col-span-1"><Label htmlFor="name">Room Name (Optional)</Label><Input id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Physics Lab" disabled={isSubmitting} /></div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="buildingId">Building *</Label>
                    <Select value={formBuildingId} onValueChange={setFormBuildingId} disabled={isSubmitting || buildings.length === 0} required>
                      <SelectTrigger id="buildingId"><SelectValue placeholder="Select Building" /></SelectTrigger>
                      <SelectContent>{buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.code || b.id.substring(0,5)})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1"><Label htmlFor="floor">Floor</Label><Input id="floor" type="number" value={formFloor === undefined ? '' : formFloor} onChange={e => setFormFloor(e.target.value !== '' ? parseInt(e.target.value) : undefined)} placeholder="e.g., 1 (0 for Ground)" disabled={isSubmitting} /></div>
                  
                  <div className="md:col-span-1">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formType} onValueChange={(value) => setFormType(value as RoomType)} disabled={isSubmitting} required>
                      <SelectTrigger id="type"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>{ROOM_TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div className="md:col-span-1"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" value={formCapacity === undefined ? '' : formCapacity} onChange={e => setFormCapacity(e.target.value !== '' ? parseInt(e.target.value) : undefined)} placeholder="e.g., 60" disabled={isSubmitting} /></div>
                  <div className="md:col-span-1"><Label htmlFor="areaSqFt">Area (sq. ft.)</Label><Input id="areaSqFt" type="number" step="0.01" value={formAreaSqFt === undefined ? '' : formAreaSqFt} onChange={e => setFormAreaSqFt(e.target.value !== '' ? parseFloat(e.target.value) : undefined)} placeholder="e.g., 1200.50" disabled={isSubmitting} /></div>

                  <div className="md:col-span-1">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formStatus} onValueChange={(value) => setFormStatus(value as RoomStatus)} disabled={isSubmitting} required>
                      <SelectTrigger id="status"><SelectValue placeholder="Select Status"/></SelectTrigger>
                      <SelectContent>{ROOM_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Any specific details about the room" disabled={isSubmitting} rows={2}/></div>
                  
                  <DialogFooter className="md:col-span-2 mt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{currentRoom?.id ? "Save Changes" : "Create Room"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={handleExportRooms} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary"/>Import Rooms from CSV</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input type="file" id="csvImportRoom" accept=".csv" onChange={handleFileChange} className="flex-grow" disabled={isSubmitting} />
              <Button onClick={handleImportRooms} disabled={isSubmitting || !selectedFile} className="w-full sm:w-auto">
                {isSubmitting && selectedFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>} Import
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadSampleCsv} variant="link" size="sm" className="px-0 text-primary">
                    <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Sample CSV
                </Button>
                <p className="text-xs text-muted-foreground">
                  CSV fields: id (optional), roomNumber, name, buildingId OR (buildingName and buildingCode), floor, type, capacity, areaSqFt, status, notes.
                </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg dark:border-gray-700">
            <div>
              <Label htmlFor="searchRoom">Search Rooms</Label>
              <div className="relative">
                 <Input id="searchRoom" placeholder="Room no, name, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8"/>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterBuilding">Filter by Building</Label>
              <Select value={filterBuildingVal} onValueChange={setFilterBuildingVal} disabled={buildings.length === 0}>
                <SelectTrigger id="filterBuilding"><SelectValue placeholder="All Buildings"/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.code || b.id.substring(0,5)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="filterType">Filter by Type</Label>
              <Select value={filterTypeVal} onValueChange={(value) => setFilterTypeVal(value as RoomType | 'all')}>
                <SelectTrigger id="filterType"><SelectValue placeholder="All Types"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Types'} as {value: RoomType | 'all', label: string}, ...ROOM_TYPE_OPTIONS.map(t => ({value: t, label: t}))].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="filterStatusRoom">Filter by Status</Label>
              <Select value={filterStatusVal} onValueChange={(value) => setFilterStatusVal(value as RoomStatus | 'all')}>
                <SelectTrigger id="filterStatusRoom"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>{[{value: 'all', label: 'All Statuses'} as {value: RoomStatus | 'all', label: string}, ...ROOM_STATUS_OPTIONS].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {selectedRoomIds.length > 0 && (
             <div className="mb-4 flex items-center gap-2">
                <Button variant="destructive" onClick={handleDeleteSelected} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedRoomIds.length})
                </Button>
                <span className="text-sm text-muted-foreground">
                    {selectedRoomIds.length} room(s) selected.
                </span>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]"><Checkbox checked={isAllSelectedOnPage || (paginatedRooms.length > 0 && isSomeSelectedOnPage ? 'indeterminate' : false)} onCheckedChange={(checkedState) => handleSelectAll(!!checkedState)} aria-label="Select all rooms on this page"/></TableHead>
                <SortableTableHeader field="roomNumber" label="Room No." />
                <SortableTableHeader field="name" label="Name" />
                <TableHead>Building</TableHead>
                <SortableTableHeader field="type" label="Type" />
                <SortableTableHeader field="capacity" label="Capacity" />
                <SortableTableHeader field="status" label="Status" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRooms.map((room) => (
                <TableRow key={room.id} data-state={selectedRoomIds.includes(room.id) ? "selected" : undefined}>
                  <TableCell><Checkbox checked={selectedRoomIds.includes(room.id)} onCheckedChange={(checked) => handleSelectRoom(room.id, !!checked)} aria-labelledby={`room-number-${room.id}`}/></TableCell>
                  <TableCell id={`room-number-${room.id}`} className="font-medium">{room.roomNumber}</TableCell>
                  <TableCell>{room.name || '-'}</TableCell>
                  <TableCell>{buildings.find(b => b.id === room.buildingId)?.name || 'N/A'}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>{room.capacity || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        room.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : room.status === 'occupied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : room.status === 'under_maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' /* unavailable */
                    }`}>
                      {ROOM_STATUS_OPTIONS.find(s => s.value === room.status)?.label || room.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(room)} disabled={isSubmitting}><Edit className="h-4 w-4" /><span className="sr-only">Edit Room</span></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(room.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Room</span></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRooms.length === 0 && (
                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No rooms found. Adjust filters or add a new room.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedRooms.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredAndSortedRooms.length): 0} to {Math.min(currentPage * itemsPerPage, filteredAndSortedRooms.length)} of {filteredAndSortedRooms.length} rooms.
            </div>
            <div className="flex items-center gap-2">
                 <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue placeholder={String(itemsPerPage)} /></SelectTrigger>
                    <SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /><span className="sr-only">First</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Prev</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /><span className="sr-only">Last</span></Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

