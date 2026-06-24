"use client";

import React, { useState, useTransition } from "react";
import {
  getDashboardStatsAdmin,
  updateExpertAdmin,
  deleteExpertAdmin,
  updateQuestionAdmin,
  deleteQuestionAdmin,
  updateFieldAdmin,
  deleteFieldAdmin,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Users,
  MessageSquare,
  Tags,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";

type DashboardStats = {
  experts: { total: number; pending: number; approved: number };
  questions: { total: number; new: number; in_review: number };
  fields: { total: number; pending: number };
};

export function AdminDashboardClient({
  initialStats,
  initialExperts,
  initialQuestions,
  initialFields,
}: {
  initialStats: DashboardStats;
  initialExperts: any[];
  initialQuestions: any[];
  initialFields: any[];
}) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [experts, setExperts] = useState<any[]>(initialExperts);
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [fields, setFields] = useState<any[]>(initialFields);

  const [activeTab, setActiveTab] = useState("experts");
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [expertSearch, setExpertSearch] = useState("");
  const [expertStatusFilter, setExpertStatusFilter] = useState("all");
  const [expertCityFilter, setExpertCityFilter] = useState("all");
  const [expertEducationFilter, setExpertEducationFilter] = useState("all");
  const [expertOccupationFilter, setExpertOccupationFilter] = useState("all");
  const [expertFieldFilter, setExpertFieldFilter] = useState("all");

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionStatusFilter, setQuestionStatusFilter] = useState("all");
  const [questionFieldFilter, setQuestionFieldFilter] = useState("all");

  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldStatusFilter, setFieldStatusFilter] = useState("all");

  // Dialog State
  const [editingExpert, setEditingExpert] = useState<any | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    type: "expert" | "question" | "field";
  } | null>(null);

  // Field Options (from fields list)
  const activeFields = fields.filter((f) => f.status === "active");

  // Unique filter lists from experts
  const expertCities = React.useMemo(() => {
    const cities = new Set<string>();
    experts.forEach((e) => {
      if (e.city) cities.add(e.city.trim());
    });
    return Array.from(cities).sort();
  }, [experts]);

  const expertEducations = React.useMemo(() => {
    const educations = new Set<string>();
    experts.forEach((e) => {
      if (e.education) educations.add(e.education.trim());
    });
    return Array.from(educations).sort();
  }, [experts]);

  const expertOccupations = React.useMemo(() => {
    const occupations = new Set<string>();
    experts.forEach((e) => {
      if (e.occupation) occupations.add(e.occupation.trim());
    });
    return Array.from(occupations).sort();
  }, [experts]);

  const refreshStats = async () => {
    try {
      const freshStats = await getDashboardStatsAdmin();
      setStats(freshStats);
    } catch (err) {
      console.error("Failed to refresh dashboard stats:", err);
    }
  };

  // --- Handlers ---
  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpert) return;

    startTransition(async () => {
      try {
        const res = await updateExpertAdmin({
          id: editingExpert.id,
          data: editingExpert,
        });

        if (res.success) {
          setExperts((prev) =>
            prev.map((e) =>
              e.id === editingExpert.id
                ? {
                  ...editingExpert,
                  fields: fields.filter((f) => editingExpert.fieldIds.includes(f.id)),
                }
                : e,
            ),
          );
          toast.success("Expert updated successfully");
          setEditingExpert(null);
          refreshStats();
        }
      } catch (err) {
        toast.error("Failed to update expert");
      }
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    startTransition(async () => {
      try {
        const res = await updateQuestionAdmin({
          id: editingQuestion.id,
          data: editingQuestion,
        });

        if (res.success) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === editingQuestion.id
                ? {
                  ...editingQuestion,
                  fields: fields.filter((f) => editingQuestion.fieldIds.includes(f.id)),
                }
                : q,
            ),
          );
          toast.success("Question updated successfully");
          setEditingQuestion(null);
          refreshStats();
        }
      } catch (err) {
        toast.error("Failed to update question");
      }
    });
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    startTransition(async () => {
      try {
        const res = await updateFieldAdmin({
          id: editingField.id,
          data: editingField,
        });

        if (res.success) {
          setFields((prev) => prev.map((f) => (f.id === editingField.id ? editingField : f)));
          toast.success("Field updated successfully");
          setEditingField(null);
          refreshStats();
        }
      } catch (err) {
        toast.error("Failed to update field");
      }
    });
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    const { id, type } = deletingItem;

    startTransition(async () => {
      try {
        let success = false;
        if (type === "expert") {
          const res = await deleteExpertAdmin({ id });
          success = res.success;
          if (success) setExperts((prev) => prev.filter((e) => e.id !== id));
        } else if (type === "question") {
          const res = await deleteQuestionAdmin({ id });
          success = res.success;
          if (success) setQuestions((prev) => prev.filter((q) => q.id !== id));
        } else if (type === "field") {
          const res = await deleteFieldAdmin({ id });
          success = res.success;
          if (success) setFields((prev) => prev.filter((f) => f.id !== id));
        }

        if (success) {
          toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
          setDeletingItem(null);
          refreshStats();
        }
      } catch (err) {
        toast.error(`Failed to delete ${type}`);
      }
    });
  };

  // --- Filtering lists ---
  const filteredExperts = experts.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
      (e.email && e.email.toLowerCase().includes(expertSearch.toLowerCase())) ||
      (e.occupation && e.occupation.toLowerCase().includes(expertSearch.toLowerCase())) ||
      (e.city && e.city.toLowerCase().includes(expertSearch.toLowerCase()));

    const matchesStatus = expertStatusFilter === "all" || e.status === expertStatusFilter;

    const matchesCity =
      expertCityFilter === "all" || (e.city && e.city.trim() === expertCityFilter);

    const matchesEducation =
      expertEducationFilter === "all" ||
      (e.education && e.education.trim() === expertEducationFilter);

    const matchesOccupation =
      expertOccupationFilter === "all" ||
      (e.occupation && e.occupation.trim() === expertOccupationFilter);

    const matchesField =
      expertFieldFilter === "all" || e.fields.some((f: any) => f.id === expertFieldFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCity &&
      matchesEducation &&
      matchesOccupation &&
      matchesField
    );
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.query_text.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.name.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.email && q.email.toLowerCase().includes(questionSearch.toLowerCase()));

    const matchesStatus = questionStatusFilter === "all" || q.status === questionStatusFilter;

    const matchesField =
      questionFieldFilter === "all" || q.fields.some((f: any) => f.id === questionFieldFilter);

    return matchesSearch && matchesStatus && matchesField;
  });

  const filteredFields = fields.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(fieldSearch.toLowerCase());
    const matchesStatus = fieldStatusFilter === "all" || f.status === fieldStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bb-container py-8 space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className="border border-border bg-card hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
          onClick={() => setActiveTab("experts")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community Experts
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">{stats.experts.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex gap-2">
              <span className="text-emerald-600 font-medium">
                {stats.experts.approved} Approved
              </span>
              {stats.experts.pending > 0 && (
                <span className="text-saffron font-medium flex items-center gap-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
                  {stats.experts.pending} Pending
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border border-border bg-card hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
          onClick={() => setActiveTab("questions")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community Questions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-saffron" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">{stats.questions.total}</div>
            <p className="text-xs text-muted-foreground mt-1 flex gap-2">
              {stats.questions.new > 0 && (
                <span className="text-saffron font-medium flex items-center gap-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
                  {stats.questions.new} New
                </span>
              )}
              {stats.questions.in_review > 0 && (
                <span className="text-blue-600 font-medium">
                  {stats.questions.in_review} In Review
                </span>
              )}
              {stats.questions.new === 0 && stats.questions.in_review === 0 && (
                <span className="text-muted-foreground">All questions processed</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card
          className="border border-border bg-card hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
          onClick={() => setActiveTab("fields")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expertise Fields
            </CardTitle>
            <Tags className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">{stats.fields.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.fields.pending > 0 ? (
                <span className="text-saffron font-medium flex items-center gap-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
                  {stats.fields.pending} Custom Fields Awaiting Review
                </span>
              ) : (
                <span className="text-muted-foreground">All fields active</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-muted border border-border p-1 rounded-lg">
            <TabsTrigger value="experts" className="cursor-pointer">
              Experts ({experts.length})
            </TabsTrigger>
            <TabsTrigger value="questions" className="cursor-pointer">
              Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="fields" className="cursor-pointer">
              Fields ({fields.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- EXPERTS TAB --- */}
        <TabsContent value="experts" className="space-y-4">
          {/* Controls */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8 bg-card border-border w-full"
                    placeholder="Search experts..."
                    value={expertSearch}
                    onChange={(e) => setExpertSearch(e.target.value)}
                  />
                </div>
                <Select value={expertStatusFilter} onValueChange={setExpertStatusFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={expertFieldFilter} onValueChange={setExpertFieldFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    {activeFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertCityFilter} onValueChange={setExpertCityFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {expertCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertEducationFilter} onValueChange={setExpertEducationFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Education" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Educations</SelectItem>
                    {expertEducations.map((edu) => (
                      <SelectItem key={edu} value={edu}>
                        {edu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertOccupationFilter} onValueChange={setExpertOccupationFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Occupations</SelectItem>
                    {expertOccupations.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertFieldFilter} onValueChange={setExpertFieldFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    {activeFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertCityFilter} onValueChange={setExpertCityFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {expertCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertEducationFilter} onValueChange={setExpertEducationFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Education" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Educations</SelectItem>
                    {expertEducations.map((edu) => (
                      <SelectItem key={edu} value={edu}>
                        {edu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={expertOccupationFilter} onValueChange={setExpertOccupationFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Occupations</SelectItem>
                    {expertOccupations.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experts Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Name & Info</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Fields</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredExperts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No experts match these filters.
                          </td>
                        </tr>
                      ) : (
                        filteredExperts.map((e) => (
                          <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-primary">{e.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {e.age} yrs • {e.gender}
                                {e.occupation ? ` • ${e.occupation}` : ""}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <a href={`mailto:${e.email}`} className="hover:underline">
                                  {e.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <a
                                  href={`tel:${e.phone}`}
                                  className="hover:underline text-muted-foreground"
                                >
                                  {e.phone}
                                </a>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {e.fields.slice(0, 3).map((f: any) => (
                                  <Badge
                                    key={f.id}
                                    variant="secondary"
                                    className="text-xs bg-muted/65 text-primary border-none"
                                  >
                                    {f.name}
                                  </Badge>
                                ))}
                                {e.fields.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-border">
                                    +{e.fields.length - 3}
                                  </Badge>
                                )}
                                {e.fields.length === 0 && (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {e.city || e.state ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{[e.city, e.state].filter(Boolean).join(", ")}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-4">
                              <StatusBadge status={e.status} />
                            </td>
                            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted text-primary cursor-pointer"
                                onClick={() => {
                                  setEditingExpert({
                                    ...e,
                                    fieldIds: e.fields.map((f: any) => f.id),
                                  });
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-destructive cursor-pointer"
                                onClick={() => setDeletingItem({ id: e.id, type: "expert" })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* --- QUESTIONS TAB --- */}
            <TabsContent value="questions" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8 bg-card border-border"
                    placeholder="Search questions by query, name, email..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                  />
                </div>
                <Select value={questionStatusFilter} onValueChange={setQuestionStatusFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={questionFieldFilter} onValueChange={setQuestionFieldFilter}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Filter by Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    {activeFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4 w-[40%]">Question</th>
                        <th className="p-4">Submitter</th>
                        <th className="p-4">Relates to</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No questions match these filters.
                          </td>
                        </tr>
                      ) : (
                        filteredQuestions.map((q) => (
                          <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-foreground line-clamp-3 whitespace-pre-wrap">
                                {q.query_text}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-primary">{q.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" /> {q.email}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" /> {q.phone}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {q.fields.map((f: any) => (
                                  <Badge
                                    key={f.id}
                                    variant="secondary"
                                    className="text-xs bg-muted/65 text-primary border-none"
                                  >
                                    {f.name}
                                  </Badge>
                                ))}
                                {q.fields.length === 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    General / Unspecified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <StatusBadge status={q.status} />
                            </td>
                            <td className="p-4 text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(q.created_at)}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted text-primary cursor-pointer"
                                onClick={() => {
                                  setEditingQuestion({
                                    ...q,
                                    fieldIds: q.fields.map((f: any) => f.id),
                                  });
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-destructive cursor-pointer"
                                onClick={() => setDeletingItem({ id: q.id, type: "question" })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* --- FIELDS TAB --- */}
            <TabsContent value="fields" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8 bg-card border-border"
                    placeholder="Search fields of expertise..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                  />
                </div>
                <Select value={fieldStatusFilter} onValueChange={setFieldStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Field Name</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date Added</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {filteredFields.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            No fields found.
                          </td>
                        </tr>
                      ) : (
                        filteredFields.map((f) => (
                          <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-semibold text-primary">{f.name}</td>
                            <td className="p-4">
                              <StatusBadge status={f.status} />
                            </td>
                            <td className="p-4 text-muted-foreground">{formatDate(f.created_at)}</td>
                            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                              {f.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-emerald-600 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-medium px-2.5 cursor-pointer inline-flex items-center gap-1 mr-1"
                                  onClick={async () => {
                                    startTransition(async () => {
                                      try {
                                        const updatedField = { ...f, status: "active" };
                                        const res = await updateFieldAdmin({
                                          id: f.id,
                                          data: updatedField,
                                        });
                                        if (res.success) {
                                          setFields((prev) =>
                                            prev.map((item) =>
                                              item.id === f.id ? updatedField : item,
                                            ),
                                          );
                                          toast.success("Field approved successfully!");
                                          refreshStats();
                                        }
                                      } catch (err) {
                                        toast.error("Failed to approve field");
                                      }
                                    });
                                  }}
                                  disabled={isPending}
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted text-primary cursor-pointer"
                                onClick={() => setEditingField(f)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-destructive cursor-pointer"
                                onClick={() => setDeletingItem({ id: f.id, type: "field" })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* --- EDIT EXPERT DIALOG --- */}
          {editingExpert && (
            <Dialog open={!!editingExpert} onOpenChange={() => setEditingExpert(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-semibold">
                    Edit Expert Profile
                  </DialogTitle>
                  <DialogDescription>
                    Modify details, change review status, or edit disciplines for this expert.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveExpert} className="space-y-6 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Basic Info */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-name">Full Name</Label>
                      <Input
                        id="exp-name"
                        value={editingExpert.name}
                        onChange={(e) => setEditingExpert({ ...editingExpert, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-status">Review Status</Label>
                      <Select
                        value={editingExpert.status}
                        onValueChange={(val) => setEditingExpert({ ...editingExpert, status: val })}
                      >
                        <SelectTrigger id="exp-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-age">Age</Label>
                      <Input
                        id="exp-age"
                        type="number"
                        value={editingExpert.age}
                        onChange={(e) =>
                          setEditingExpert({
                            ...editingExpert,
                            age: parseInt(e.target.value, 10) || "",
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-gender">Gender</Label>
                      <Select
                        value={editingExpert.gender}
                        onValueChange={(val) => setEditingExpert({ ...editingExpert, gender: val })}
                      >
                        <SelectTrigger id="exp-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-email">Email Address</Label>
                      <Input
                        id="exp-email"
                        type="email"
                        value={editingExpert.email}
                        onChange={(e) => setEditingExpert({ ...editingExpert, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-phone">Phone Number</Label>
                      <Input
                        id="exp-phone"
                        value={editingExpert.phone}
                        onChange={(e) => setEditingExpert({ ...editingExpert, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-blood">Blood Group</Label>
                      <Select
                        value={editingExpert.blood_group || "Unknown"}
                        onValueChange={(val) =>
                          setEditingExpert({ ...editingExpert, blood_group: val })
                        }
                      >
                        <SelectTrigger id="exp-blood">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-education">Education</Label>
                      <Input
                        id="exp-education"
                        value={editingExpert.education || ""}
                        onChange={(e) =>
                          setEditingExpert({ ...editingExpert, education: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-occupation">Occupation</Label>
                      <Input
                        id="exp-occupation"
                        value={editingExpert.occupation || ""}
                        onChange={(e) =>
                          setEditingExpert({ ...editingExpert, occupation: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-digital">Digital Identity (Profile Link)</Label>
                      <Input
                        id="exp-digital"
                        value={editingExpert.digital_identity || ""}
                        onChange={(e) =>
                          setEditingExpert({ ...editingExpert, digital_identity: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-city">City</Label>
                      <Input
                        id="exp-city"
                        value={editingExpert.city || ""}
                        onChange={(e) => setEditingExpert({ ...editingExpert, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-state">State</Label>
                      <Input
                        id="exp-state"
                        value={editingExpert.state || ""}
                        onChange={(e) => setEditingExpert({ ...editingExpert, state: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Full Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="exp-address">Full Address</Label>
                    <Input
                      id="exp-address"
                      value={editingExpert.address || ""}
                      onChange={(e) => setEditingExpert({ ...editingExpert, address: e.target.value })}
                    />
                  </div>

                  {/* Core Offerings */}
                  <div className="space-y-1.5">
                    <Label htmlFor="exp-offer">What I Can Offer</Label>
                    <Textarea
                      id="exp-offer"
                      rows={3}
                      value={editingExpert.what_i_can_offer || ""}
                      onChange={(e) =>
                        setEditingExpert({ ...editingExpert, what_i_can_offer: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="exp-expect">What I Expect</Label>
                    <Textarea
                      id="exp-expect"
                      rows={2}
                      value={editingExpert.what_i_expect || ""}
                      onChange={(e) =>
                        setEditingExpert({ ...editingExpert, what_i_expect: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-hobbies">Hobbies & Interests</Label>
                      <Input
                        id="exp-hobbies"
                        value={editingExpert.hobbies_interests || ""}
                        onChange={(e) =>
                          setEditingExpert({ ...editingExpert, hobbies_interests: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exp-notes">Special Admin Notes</Label>
                      <Input
                        id="exp-notes"
                        value={editingExpert.special_notes || ""}
                        onChange={(e) =>
                          setEditingExpert({ ...editingExpert, special_notes: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Expertise fields selection */}
                  <div className="space-y-2">
                    <Label>Fields of Expertise</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-border rounded-md bg-muted/30">
                      {activeFields.map((f) => {
                        const isChecked = editingExpert.fieldIds?.includes(f.id);
                        return (
                          <button
                            type="button"
                            key={f.id}
                            className={`rounded-full border px-3 py-1 text-xs cursor-pointer transition-all ${isChecked
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-foreground hover:bg-muted"
                              }`}
                            onClick={() => {
                              const ids = editingExpert.fieldIds || [];
                              const updatedIds = isChecked
                                ? ids.filter((id: string) => id !== f.id)
                                : [...ids, f.id];
                              setEditingExpert({ ...editingExpert, fieldIds: updatedIds });
                            }}
                          >
                            {f.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingExpert(null)}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* --- EDIT QUESTION DIALOG --- */}
          {editingQuestion && (
            <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-semibold">
                    Edit Question
                  </DialogTitle>
                  <DialogDescription>
                    Review submitter info, update response status, or modify question text.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveQuestion} className="space-y-5 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="q-name">Submitter Name</Label>
                      <Input
                        id="q-name"
                        value={editingQuestion.name}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-status">Status</Label>
                      <Select
                        value={editingQuestion.status}
                        onValueChange={(val) => setEditingQuestion({ ...editingQuestion, status: val })}
                      >
                        <SelectTrigger id="q-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="answered">Answered</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-email">Submitter Email</Label>
                      <Input
                        id="q-email"
                        type="email"
                        value={editingQuestion.email}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-phone">Submitter Phone</Label>
                      <Input
                        id="q-phone"
                        value={editingQuestion.phone}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="q-text">Question Text</Label>
                    <Textarea
                      id="q-text"
                      rows={5}
                      value={editingQuestion.query_text}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, query_text: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Fields category selection */}
                  <div className="space-y-2">
                    <Label>Relates to Fields</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-border rounded-md bg-muted/30">
                      {activeFields.map((f) => {
                        const isChecked = editingQuestion.fieldIds?.includes(f.id);
                        return (
                          <button
                            type="button"
                            key={f.id}
                            className={`rounded-full border px-3 py-1 text-xs cursor-pointer transition-all ${isChecked
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-foreground hover:bg-muted"
                              }`}
                            onClick={() => {
                              const ids = editingQuestion.fieldIds || [];
                              const updatedIds = isChecked
                                ? ids.filter((id: string) => id !== f.id)
                                : [...ids, f.id];
                              setEditingQuestion({ ...editingQuestion, fieldIds: updatedIds });
                            }}
                          >
                            {f.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingQuestion(null)}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* --- EDIT FIELD DIALOG --- */}
          {editingField && (
            <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
              <DialogContent className="max-w-md bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-semibold">
                    Edit Field Name
                  </DialogTitle>
                  <DialogDescription>
                    Update the display name or status of this community expertise category.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveField} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="f-name">Field Name</Label>
                    <Input
                      id="f-name"
                      value={editingField.name}
                      onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="f-status">Status</Label>
                    <Select
                      value={editingField.status}
                      onValueChange={(val) => setEditingField({ ...editingField, status: val })}
                    >
                      <SelectTrigger id="f-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Visible Publicly)</SelectItem>
                        <SelectItem value="pending">Pending Review (Hidden)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      {isPending ? "Saving..." : "Save Field"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* --- DELETE CONFIRMATION DIALOG --- */}
          {deletingItem && (
            <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
              <AlertDialogContent className="bg-card border border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-xl font-bold flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" /> Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected{" "}
                    <span className="font-semibold text-foreground">{deletingItem.type}</span> from the
                    database and remove any associated linkages.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending} className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteItem}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    disabled={isPending}
                  >
                    {isPending ? "Deleting..." : "Permanently Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        );
}

        // Simple Color-Coded Badges for Status
        function StatusBadge({status}: {status: string }) {
  switch (status) {
    case "approved":
        case "active":
        return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle className="h-3 w-3" /> Active
        </span>
        );
        case "pending":
        case "pending_review":
        case "new":
        case "in_review":
        return (
        <span className="inline-flex items-center gap-1 rounded-full bg-saffron/10 px-2 py-0.5 text-xs font-semibold text-saffron-foreground border border-saffron/20">
          <Clock className="h-3 w-3" /> {status === "in_review" ? "In Review" : "Pending"}
        </span>
        );
        case "rejected":
        case "closed":
        return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
          <XCircle className="h-3 w-3" /> {status === "rejected" ? "Rejected" : "Closed"}
        </span>
        );
        default:
        return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
          {status}
        </span>
        );
  }
}
