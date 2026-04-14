import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardContent, DataTable, Button, Badge, HStack, VStack,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Persona,
} from '@blinkdotnew/ui'
import { Database, Phone, Star, MapPin, Clock, ExternalLink, Edit3, Check, Bell, BellOff } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { blink } from '@/blink/client'
import { LEADS } from '../data/leads'
import { getNotifyEmail, setNotifyEmail, sendStatusChangeEmail } from '@/hooks/useNotifications'

const STATUS_OPTIONS = [
  { value: '🔴 Not Contacted', label: '🔴 Not Contacted' },
  { value: '🟡 Called — No Answer', label: '🟡 Called — No Answer' },
  { value: '🟠 Left Voicemail', label: '🟠 Left Voicemail' },
  { value: '🟢 Interested', label: '🟢 Interested' },
  { value: '✅ Closed', label: '✅ Closed' },
  { value: '❌ Not Interested', label: '❌ Not Interested' },
]

const colorMap: Record<string, string> = {
  '🔴 Not Contacted': 'bg-red-50 text-red-700 border-red-200',
  '🟡 Called — No Answer': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '🟠 Left Voicemail': 'bg-orange-50 text-orange-700 border-orange-200',
  '🟢 Interested': 'bg-green-50 text-green-700 border-green-200',
  '✅ Closed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '❌ Not Interested': 'bg-red-50 text-red-600 border-red-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorMap[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  )
}

export default function LeadsDatabase() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editLead, setEditLead] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [notifyEmail, setNotifyEmailState] = useState(getNotifyEmail)
  const [notifyEmailInput, setNotifyEmailInput] = useState(getNotifyEmail)
  const [showNotifyBanner, setShowNotifyBanner] = useState(false)
  const [notifySent, setNotifySent] = useState(false)

  const leads = LEADS

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      blink.db.leads.update(id, { status }),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads-db'] })
      const email = getNotifyEmail()
      if (email && editLead) {
        const sent = await sendStatusChangeEmail({
          toEmail: email,
          businessName: editLead.business_name,
          oldStatus: editLead.status,
          newStatus: variables.status,
          phone: editLead.phone,
          category: editLead.category,
        })
        if (sent) setNotifySent(true)
      }
      setEditLead(null)
    },
  })

  const columns = [
    {
      accessorKey: 'business_name',
      header: 'Business',
      cell: ({ row }: any) => (
        <Persona name={row.original?.business_name || 'Unknown'} subtitle={row.original?.category || ''} />
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }: any) => (
        <a href={`tel:${row.original.phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
          <Phone className="h-3 w-3" />
          {row.original.phone || '—'}
        </a>
      ),
    },
    {
      accessorKey: 'full_address',
      header: 'Location',
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[180px]">{row.original.full_address || 'Frisco, TX'}</span>
        </span>
      ),
    },
    {
      accessorKey: 'google_rating',
      header: 'Rating',
      cell: ({ row }: any) => (
        <HStack gap={1} className="items-center">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{row.original.google_rating}</span>
          <span className="text-xs text-muted-foreground">({row.original.review_count})</span>
        </HStack>
      ),
    },
    {
      accessorKey: 'best_call_time',
      header: 'Best Time to Call',
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {row.original.best_call_time || 'Anytime'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <HStack gap={2}>
          <Button variant="ghost" size="sm" onClick={() => { setEditLead(row.original); setNewStatus(row.original.status) }}>
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: `/preview/${row.original.id}` })}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
        </HStack>
      ),
    },
  ]

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <HStack className="items-start justify-between w-full">
          <VStack gap={1}>
            <PageTitle>Leads Database</PageTitle>
            <PageDescription>Full record of all {leads.length} scouted businesses in Frisco, TX. Update status after each call.</PageDescription>
          </VStack>
          <Button
            variant={notifyEmail ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowNotifyBanner(v => !v)}
            className="flex-shrink-0 mt-1"
          >
            {notifyEmail ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {notifyEmail ? 'Alerts On' : 'Enable Alerts'}
          </Button>
        </HStack>
      </PageHeader>
      <PageBody>
        {showNotifyBanner && (
          <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Email notifications for status changes</p>
              <p className="text-xs text-muted-foreground">You'll get an email every time a lead status is updated.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={notifyEmailInput}
                onChange={e => setNotifyEmailInput(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 sm:w-56 px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button
                size="sm"
                onClick={() => {
                  setNotifyEmail(notifyEmailInput)
                  setNotifyEmailState(notifyEmailInput)
                  setShowNotifyBanner(false)
                }}
                disabled={!notifyEmailInput}
              >
                Save
              </Button>
              {notifyEmail && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNotifyEmail('')
                    setNotifyEmailState('')
                    setNotifyEmailInput('')
                    setShowNotifyBanner(false)
                  }}
                >
                  Turn Off
                </Button>
              )}
            </div>
          </div>
        )}
        {notifySent && (
          <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 flex items-center gap-2 text-green-700 text-sm font-medium">
            <Check className="h-4 w-4" />
            Email notification sent to {notifyEmail}
            <button onClick={() => setNotifySent(false)} className="ml-auto text-green-500 hover:text-green-700 text-xs">✕</button>
          </div>
        )}
        <Card>
          <CardContent className="pt-6">
            <HStack gap={2} className="items-center mb-6">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">All Leads</h3>
              <Badge variant="outline" className="ml-auto">{leads.length} records</Badge>
            </HStack>
            <DataTable columns={columns} data={leads} searchable searchColumn="business_name" />
          </CardContent>
        </Card>
      </PageBody>
      <Dialog open={!!editLead} onOpenChange={(o) => { if (!o) setEditLead(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>{editLead?.business_name}</DialogDescription>
          </DialogHeader>
          <VStack gap={4} className="py-2">
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Hook / Note</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{editLead?.hook || 'No hook recorded.'}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <HStack gap={3} className="justify-end pt-2">
              <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
              <Button onClick={() => updateStatus.mutate({ id: editLead.id, status: newStatus })} disabled={updateStatus.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Save Status
              </Button>
            </HStack>
          </VStack>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
