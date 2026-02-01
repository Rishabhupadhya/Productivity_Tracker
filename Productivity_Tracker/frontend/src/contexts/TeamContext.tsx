import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  getUserTeams,
  switchTeam as switchTeamService,
  createTeam as createTeamService,
  type Team
} from "../services/team.service";
import { useUser } from "./UserContext";

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  loading: boolean;
  error: string | null;
  createTeam: (name: string) => Promise<void>;
  switchTeam: (teamId: string | null) => Promise<void>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Load teams when user is available
  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const userTeams = await getUserTeams();
      setTeams(userTeams);

      // Set active team from user's activeTeamId
      if (user?.activeTeamId) {
        const active = userTeams.find((t: any) => t._id === user.activeTeamId);
        setActiveTeam(active || null);
      } else {
        setActiveTeam(null);
      }
    } catch (err: any) {
      console.error("Failed to load teams:", err);
      setError(err.response?.data?.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string) => {
    try {
      setError(null);
      const newTeam = await createTeamService(name);
      setTeams([...teams, newTeam]);
      setActiveTeam(newTeam);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create team";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const switchTeam = async (teamId: string | null) => {
    try {
      setError(null);
      await switchTeamService(teamId);
      
      if (teamId) {
        const team = teams.find(t => t._id === teamId);
        setActiveTeam(team || null);
      } else {
        setActiveTeam(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to switch team";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshTeams = async () => {
    await loadTeams();
  };

  const value: TeamContextType = {
    teams,
    activeTeam,
    loading,
    error,
    createTeam,
    switchTeam,
    refreshTeams,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
