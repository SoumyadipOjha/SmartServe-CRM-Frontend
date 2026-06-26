import apiClient from './api-client';

export interface TeamMember {
  _id:               string;
  name:              string;
  email:             string;
  teamRole:          'owner' | 'admin' | 'member';
  organizationOwner: string | null;
  createdAt:         string;
}

export interface TeamInvite {
  _id:       string;
  email:     string;
  teamRole:  'admin' | 'member';
  token:     string;
  accepted:  boolean;
  expiresAt: string;
  createdAt: string;
}

const TeamService = {
  getTeam:    ()                                      => apiClient.get<TeamMember[]>('/team').then(r => r.data),
  getInvites: ()                                      => apiClient.get<TeamInvite[]>('/team/invites').then(r => r.data),
  invite:     (email: string, teamRole: string)       => apiClient.post<{ invite: TeamInvite; inviteLink: string }>('/team/invite', { email, teamRole }).then(r => r.data),
  revokeInvite: (inviteId: string)                    => apiClient.delete(`/team/invites/${inviteId}`),
  updateRole: (memberId: string, teamRole: string)    => apiClient.patch<TeamMember>(`/team/members/${memberId}/role`, { teamRole }).then(r => r.data),
  removeMember: (memberId: string)                    => apiClient.delete(`/team/members/${memberId}`),
};

export default TeamService;
