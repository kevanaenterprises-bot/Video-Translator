import React from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  StatGroup, Stat, Card, CardContent, VStack, HStack, Badge
} from '@blinkdotnew/ui'
import { BarChart3, TrendingUp, Users, Target, DollarSign, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { LEADS } from '../data/leads'

const COLORS = ['#5048E5', '#12BA7C', '#6A63E9', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

export default function Performance() {
  const leads = LEADS

  const categoryMap: Record<string, number> = {}
  leads.forEach((l) => {
    const cat = l.category || 'Other'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

  const ratingBuckets: Record<string, number> = { '4.0-4.3': 0, '4.3-4.5': 0, '4.5-4.7': 0, '4.7-4.9': 0, '4.9-5.0': 0 }
  leads.forEach((l) => {
    const r = l.google_rating || 0
    if (r >= 4.9) ratingBuckets['4.9-5.0']++
    else if (r >= 4.7) ratingBuckets['4.7-4.9']++
    else if (r >= 4.5) ratingBuckets['4.5-4.7']++
    else if (r >= 4.3) ratingBuckets['4.3-4.5']++
    else ratingBuckets['4.0-4.3']++
  })
  const ratingData = Object.entries(ratingBuckets).map(([name, value]) => ({ name, value }))

  const avgRating = leads.length
    ? (leads.reduce((sum, l) => sum + (l.google_rating || 0), 0) / leads.length).toFixed(1)
    : '0'
  const totalReviews = leads.reduce((sum, l) => sum + (l.review_count || 0), 0)
  const pipelineValue = (leads.length * 2500).toLocaleString()

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <VStack gap={1}>
          <PageTitle>Performance</PageTitle>
          <PageDescription>Pipeline analytics and lead quality metrics for your Frisco, TX campaign.</PageDescription>
        </VStack>
      </PageHeader>
      <PageBody>
        <StatGroup className="mb-8">
          <Stat label="Total Pipeline" value={`$${pipelineValue}`} icon={<DollarSign className="text-primary" />} trend={18} trendLabel="estimated revenue" />
          <Stat label="Avg. Google Rating" value={avgRating} icon={<Star className="text-yellow-500" />} trend={5} trendLabel="above market avg" />
          <Stat label="Total Reviews" value={totalReviews.toString()} icon={<Users className="text-secondary" />} />
          <Stat label="Close Rate Target" value="15%" icon={<Target className="text-accent" />} trend={0} trendLabel="industry avg" />
        </StatGroup>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <HStack gap={2} className="items-center mb-6">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Leads by Category</h3>
              </HStack>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} leads`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <HStack gap={2} className="items-center mb-6">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="font-bold text-lg">Rating Distribution</h3>
              </HStack>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ratingData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6">
            <HStack gap={2} className="items-center mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Top Opportunity Leads</h3>
              <Badge variant="outline" className="ml-auto text-xs">Sorted by review volume</Badge>
            </HStack>
            <div className="space-y-3">
              {[...leads]
                .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
                .slice(0, 5)
                .map((lead, i) => {
                  const score = Math.min(100, Math.round(((lead.google_rating || 4) / 5) * 60 + Math.min((lead.review_count || 0) / 3, 40)))
                  return (
                    <div key={lead.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{lead.business_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.category} · ⭐ {lead.google_rating} · {lead.review_count} reviews</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-sm font-bold w-10 text-right">{score}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </Page>
  )
}
