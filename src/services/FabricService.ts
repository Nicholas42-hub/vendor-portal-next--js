import { VendorData, SimilarVendor, GeneralDetails } from '../models/VendorTypes';

// This is a placeholder for the actual Fabric API client
// You would need to replace this with the actual client library for Fabric
interface FabricClient {
  getVendors(): Promise<any[]>;
  createVendor(vendor: any): Promise<any>;
  getApprovers(businessUnit: string): Promise<any[]>;
  getApproverName(email: string): Promise<string | null>;
}

// This would be replaced by your actual initialization
const fabricClient: FabricClient = {
  getVendors: async () => [],
  createVendor: async (vendor) => vendor,
  getApprovers: async (businessUnit) => [],
  getApproverName: async (email) => null,
};

export class FabricService {
  /**
   * Check for similar vendors in the system
   */
  async checkSimilarVendors(generalDetails: GeneralDetails): Promise<{ 
    hasSimilarVendors: boolean;
    similarVendors: SimilarVendor[];
  }> {
    try {
      const existingVendors = await fabricClient.getVendors();
      const vendors = existingVendors.filter(v => v.createdVendor === "Yes");
      
      const similarities: SimilarVendor[] = [];
      
      for (const vendor of vendors) {
        const similarityScore = this.calculateVendorSimilarity(generalDetails, vendor);
        if (similarityScore >= 0.7) { // 70% similarity threshold
          similarities.push({
            businessName: vendor.businessName,
            email: vendor.email,
            similarity: similarityScore,
            matchedCriteria: this.getMatchedCriteria(generalDetails, vendor)
          });
        }
      }
      
      return {
        hasSimilarVendors: similarities.length > 0,
        similarVendors: similarities.sort((a, b) => b.similarity - a.similarity)
      };
    } catch (error) {
      console.error("Error checking similar vendors:", error);
      return { hasSimilarVendors: false, similarVendors: [] };
    }
  }
  
  /**
   * Calculate similarity between vendor data
   */
  private calculateVendorSimilarity(formData: GeneralDetails, existingVendor: any): number {
    let score = 0;
    let totalWeight = 0;
    
    // Business name similarity (weight: 0.3)
    const businessNameSimilarity = this.calculateStringSimilarity(
      formData.businessName.toLowerCase(),
      existingVendor.businessName.toLowerCase()
    );
    score += businessNameSimilarity * 0.3;
    totalWeight += 0.3;
    
    // Email domain similarity (weight: 0.2)
    const emailDomain1 = formData.email.split('@')[1];
    const emailDomain2 = existingVendor.email.split('@')[1];
    if (emailDomain1 === emailDomain2) {
      score += 0.2;
    }
    totalWeight += 0.2;
    
    // Business unit match (weight: 0.2)
    if (formData.primaryTradingBusinessUnit === existingVendor.primaryTradingBusinessUnit) {
      score += 0.2;
    }
    totalWeight += 0.2;
    
    // Vendor type match (weight: 0.2)
    if (formData.vendorType === existingVendor.vendorType) {
      score += 0.2;
    }
    totalWeight += 0.2;
    
    // Home country match (weight: 0.1)
    if (formData.vendorHomeCountry === existingVendor.vendorHomeCountry) {
      score += 0.1;
    }
    totalWeight += 0.1;
    
    return score / totalWeight;
  }
  
  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len1 + 1).fill(0).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    return 1 - (matrix[len1][len2] / Math.max(len1, len2));
  }
  
  /**
   * Get matched criteria between vendor entries
   */
  private getMatchedCriteria(formData: GeneralDetails, vendor: any): string[] {
    const matches: string[] = [];
    
    // Business name similarity check
    if (this.calculateStringSimilarity(
      formData.businessName.toLowerCase(),
      vendor.businessName.toLowerCase()
    ) > 0.8) {
      matches.push('Similar business name');
    }
    
    // Email domain match
    if (formData.email.split('@')[1] === vendor.email.split('@')[1]) {
      matches.push('Same email domain');
    }
    
    // Business unit match
    if (formData.primaryTradingBusinessUnit === vendor.primaryTradingBusinessUnit) {
      matches.push('Same business unit');
    }
    
    // Vendor type match
    if (formData.vendorType === vendor.vendorType) {
      matches.push('Same vendor type');
    }
    
    // Home country match
    if (formData.vendorHomeCountry === vendor.vendorHomeCountry) {
      matches.push('Same home country');
    }
    
    return matches;
  }
  
  /**
   * Submit vendor data to Fabric Warehouse
   */
  async submitVendorData(vendorData: VendorData, isChildVendor: boolean): Promise<boolean> {
    try {
      const { generalDetails, tradingTerms, supplyTerms, financialTerms } = vendorData;
      
      // Get the approvers for this business unit
      const approvers = await fabricClient.getApprovers(generalDetails.primaryTradingBusinessUnit);
      
      if (!approvers || approvers.length === 0) {
        throw new Error("No approvers found for the selected business unit");
      }
      
      const approver = approvers[0];
      const approverName = await fabricClient.getApproverName(approver.approver1);
      
      // Build the vendor record
      const vendorRecord = {
        email: generalDetails.email,
        businessName: generalDetails.businessName,
        vendorHomeCountry: generalDetails.vendorHomeCountry,
        createdVendor: "Yes",
        vendorSetupStatus: "Yes",
        ...(isChildVendor ? {
          parentVendor: generalDetails.parentVendor,
          statusCode: "Pending Manager Approval",
        } : {
          vendorEmailInvitation: "Yes",
          statusCode: "Invitation sent"
        }),
        vendorEmail: generalDetails.email,
        primaryTradingBusinessUnit: generalDetails.primaryTradingBusinessUnit,
        vendorType: generalDetails.vendorType,
        tradingEntities: tradingEntitiesString,
        
        // Trading terms
        quotesObtained: tradingTerms.quotesObtained,
        quotesObtainedReason: tradingTerms.quotesObtainedReason,
        backOrder: tradingTerms.backOrder,
        
        // Supply terms
        exclusiveSupply: supplyTerms.exclusiveSupply,
        saleOrReturn: supplyTerms.saleOrReturn,
        authRequired: supplyTerms.authRequired,
        deliveryNotice: supplyTerms.deliveryNotice,
        minOrderValue: supplyTerms.minOrderValue,
        minOrderQuantity: supplyTerms.minOrderQuantity,
        maxOrderValue: supplyTerms.maxOrderValue,
        otherComments: supplyTerms.otherComments,
        
        // Financial terms
        paymentTerms: financialTerms.paymentTerms,
        orderExpiryDays: financialTerms.orderExpiryDays,
        grossMargin: financialTerms.grossMargin,
        invoiceDiscount: financialTerms.invoiceDiscount,
        invoiceDiscountValue: financialTerms.invoiceDiscountValue,
        settlementDiscount: financialTerms.settlementDiscount,
        settlementDiscountValue: financialTerms.settlementDiscountValue,
        settlementDiscountDays: financialTerms.settlementDiscountDays,
        flatRebate: financialTerms.flatRebate,
        flatRebatePercent: financialTerms.flatRebatePercent,
        flatRebateDollar: financialTerms.flatRebateDollar,
        flatRebateTerm: financialTerms.flatRebateTerm,
        growthRebate: financialTerms.growthRebate,
        growthRebatePercent: financialTerms.growthRebatePercent,
        growthRebateDollar: financialTerms.growthRebateDollar,
        growthRebateTerm: financialTerms.growthRebateTerm,
        marketingRebate: financialTerms.marketingRebate,
        marketingRebatePercent: financialTerms.marketingRebatePercent,
        marketingRebateDollar: financialTerms.marketingRebateDollar,
        marketingRebateTerm: financialTerms.marketingRebateTerm,
        promotionalFund: financialTerms.promotionalFund,
        promotionalFundValue: financialTerms.promotionalFundValue,
        
        // System fields
        createdByUserName: "Current User", // Replace with actual user info
        createdByEmail: "user@example.com", // Replace with actual user info
        currentApprover: approver.approver1,
        currentApproverName: approverName || approver.approver1
      };
      
      // Submit the vendor record to Fabric
      const result = await fabricClient.createVendor(vendorRecord);
      
      return !!result;
    } catch (error) {
      console.error("Error submitting vendor data:", error);
      throw error;
    }
  }
  
  /**
   * Get parent vendors for the dropdown
   */
  async getParentVendors(): Promise<Array<{id: string, name: string, email: string}>> {
    try {
      const vendors = await fabricClient.getVendors();
      return vendors
        .filter(v => v.vendorSetupStatus === "Yes")
        .map(v => ({
          id: v.id,
          name: v.businessName,
          email: v.email
        }));
    } catch (error) {
      console.error("Error fetching parent vendors:", error);
      return [];
    }
  }
}