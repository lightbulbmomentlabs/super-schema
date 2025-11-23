import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rocket,
  Filter,
  Check,
  Clock,
  Star,
  Mail,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { markTabAsViewed } from '@/hooks/useAdminBadgeCounts';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminPrivateBetaRequests() {
  const queryClient = useQueryClient();
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [filterPaying, setFilterPaying] = useState<'all' | 'paying' | 'free'>('all');
  const [filterGranted, setFilterGranted] = useState<'all' | 'pending' | 'granted'>('pending');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Mark this tab as viewed when component mounts
  useEffect(() => {
    markTabAsViewed('beta-requests');
  }, []);

  // Get all features
  const { data: featuresData } = useQuery({
    queryKey: ['admin-features'],
    queryFn: () => apiService.getFeatures()
  });

  // Get beta requests with filters
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-beta-requests', selectedFeature, filterPaying, filterGranted],
    queryFn: () => apiService.getBetaRequests({
      featureId: selectedFeature === 'all' ? undefined : selectedFeature,
      isPaying: filterPaying === 'all' ? undefined : filterPaying === 'paying',
      granted: filterGranted === 'all' ? undefined : filterGranted === 'pending' ? false : true
    })
  });

  // Grant beta access mutation
  const grantAccessMutation = useMutation({
    mutationFn: (requestId: string) => apiService.grantBetaAccess(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      // Invalidate feature-access queries so users see updated access immediately
      queryClient.invalidateQueries({ queryKey: ['feature-access'] });
    }
  });

  const features = featuresData?.data || [];
  const requests = requestsData?.data?.requests || [];
  const totalRequests = requestsData?.data?.total || 0;

  // Calculate stats
  const pendingCount = requests.filter((r: any) => !r.granted_at).length;
  const payingCustomerCount = requests.filter((r: any) => r.is_paying_customer && !r.granted_at).length;

  const handleGrantAccess = (request: any) => {
    setSelectedRequest(request);
    setConfirmModalOpen(true);
  };

  const handleConfirmGrant = async () => {
    if (selectedRequest) {
      await grantAccessMutation.mutateAsync(selectedRequest.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Private Beta Requests</h1>
            <p className="text-sm text-muted-foreground">
              Manage user access to features in private beta
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold mt-1">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paying Customers</p>
              <p className="text-2xl font-bold mt-1">{payingCustomerCount}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold mt-1">{totalRequests}</p>
            </div>
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Feature filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Feature</label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Features</option>
              {features.map((feature: any) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name} ({feature.pending_requests})
                </option>
              ))}
            </select>
          </div>

          {/* Payment status filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Customer Type</label>
            <select
              value={filterPaying}
              onChange={(e) => setFilterPaying(e.target.value as any)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Customers</option>
              <option value="paying">Paying Only</option>
              <option value="free">Free Only</option>
            </select>
          </div>

          {/* Grant status filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={filterGranted}
              onChange={(e) => setFilterGranted(e.target.value as any)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="pending">Pending Only</option>
              <option value="granted">Granted Only</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Feature</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requestsLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No requests found</p>
                  </td>
                </tr>
              ) : (
                requests.map((request: any) => (
                  <tr key={request.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{request.email}</p>
                          {request.first_name && (
                            <p className="text-xs text-muted-foreground">
                              {request.first_name} {request.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-card border border-border">
                          {request.feature_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.requested_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      {request.granted_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {request.is_paying_customer ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                          <Star className="h-3 w-3 mr-1" />
                          Paying
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-card border border-border">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {!request.granted_at && (
                        <button
                          onClick={() => handleGrantAccess(request)}
                          disabled={grantAccessMutation.isPending}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {grantAccessMutation.isPending ? (
                            <>
                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Granting...
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Grant Access
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmGrant}
        title="Grant Beta Access"
        message={
          selectedRequest
            ? `Grant beta access to ${selectedRequest.email} for ${selectedRequest.feature_name}? They will receive an in-app notification.`
            : ''
        }
        confirmText="Grant Access"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}
