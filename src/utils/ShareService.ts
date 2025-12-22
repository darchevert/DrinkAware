import { Share, Platform } from 'react-native';

export type ShareType = 'milestone' | 'streak' | 'totalDays' | 'stats';

interface ShareOptions {
  type: ShareType;
  milestoneName?: string;
  days?: number;
  totalDays?: number;
  currentStreak?: number;
  longestStreak?: number;
  language?: 'fr' | 'en';
}

export class ShareService {
  static async shareContent(options: ShareOptions): Promise<void> {
    const { type, language = 'fr' } = options;
    
    let message = '';
    
    switch (type) {
      case 'milestone':
        if (options.milestoneName && options.days) {
          message = language === 'fr'
            ? `🎉 J'ai atteint le challenge "${options.milestoneName}" après ${options.days} jours de sobriété !\n\n#Sobriété #Progression #Fierté`
            : `🎉 I've reached the milestone "${options.milestoneName}" after ${options.days} days of sobriety!\n\n#Sobriety #Progress #Pride`;
        }
        break;
      
      case 'streak':
        if (options.currentStreak) {
          message = language === 'fr'
            ? `🔥 ${options.currentStreak} jours de sobriété consécutifs ! Chaque jour est une victoire.\n\n#Sobriété #SérieActuelle #Motivation`
            : `🔥 ${options.currentStreak} consecutive days of sobriety! Every day is a victory.\n\n#Sobriety #CurrentStreak #Motivation`;
        }
        break;
      
      case 'totalDays':
        if (options.totalDays) {
          message = language === 'fr'
            ? `📊 ${options.totalDays} jours de sobriété au total ! Je continue sur cette belle voie.\n\n#Sobriété #TotalJours #Fierté`
            : `📊 ${options.totalDays} total days of sobriety! I'm continuing on this beautiful path.\n\n#Sobriety #TotalDays #Pride`;
        }
        break;
      
      case 'stats':
        const parts: string[] = [];
        if (options.currentStreak) {
          parts.push(language === 'fr' 
            ? `${options.currentStreak} jours de série actuelle` 
            : `${options.currentStreak} days current streak`);
        }
        if (options.totalDays) {
          parts.push(language === 'fr' 
            ? `${options.totalDays} jours au total` 
            : `${options.totalDays} total days`);
        }
        if (options.longestStreak) {
          parts.push(language === 'fr' 
            ? `${options.longestStreak} jours de série la plus longue` 
            : `${options.longestStreak} days longest streak`);
        }
        
        message = language === 'fr'
          ? `📈 Mes statistiques de sobriété :\n\n${parts.join('\n')}\n\n#Sobriété #Statistiques #Progression`
          : `📈 My sobriety statistics:\n\n${parts.join('\n')}\n\n#Sobriety #Statistics #Progress`;
        break;
    }
    
    if (!message) {
      console.warn('ShareService: Message vide pour le type', type);
      return;
    }
    
    try {
      const result = await Share.share({
        message: message,
        title: language === 'fr' ? 'Partager ma progression' : 'Share my progress',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Partage réussi avec une application spécifique
          console.log('Partagé via', result.activityType);
        } else {
          // Partage réussi
          console.log('Partage réussi');
        }
      } else if (result.action === Share.dismissedAction) {
        // L'utilisateur a annulé le partage
        console.log('Partage annulé');
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      throw error;
    }
  }
  
  static async shareMilestone(milestoneName: string, days: number, language: 'fr' | 'en' = 'fr'): Promise<void> {
    return this.shareContent({
      type: 'milestone',
      milestoneName,
      days,
      language,
    });
  }
  
  static async shareStreak(currentStreak: number, language: 'fr' | 'en' = 'fr'): Promise<void> {
    return this.shareContent({
      type: 'streak',
      currentStreak,
      language,
    });
  }
  
  static async shareTotalDays(totalDays: number, language: 'fr' | 'en' = 'fr'): Promise<void> {
    return this.shareContent({
      type: 'totalDays',
      totalDays,
      language,
    });
  }
  
  static async shareStats(stats: {
    currentStreak?: number;
    totalDays?: number;
    longestStreak?: number;
  }, language: 'fr' | 'en' = 'fr'): Promise<void> {
    return this.shareContent({
      type: 'stats',
      ...stats,
      language,
    });
  }
}

