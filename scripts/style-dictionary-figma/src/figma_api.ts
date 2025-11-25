import axios from 'axios';
import { GetLocalVariablesResponse } from '@figma/rest-api-spec';

// Defines a class to interact with the Figma API, specifically to retrieve local variables from a Figma file.
export default class FigmaApi {
  private baseUrl = 'https://api.figma.com'; // Base URL for the Figma API.
  private token: string; // Authentication token for Figma API access.

  // Constructor initializes the class with a Figma API token.
  constructor(token: string) {
    this.token = token;
  }

  // Asynchronously retrieves local variables from a specified Figma file.
  async getLocalVariables(fileKey: string) {
    // Constructs the URL for the Figma API endpoint to get local variables.
    const figmaUrlLocation = `${this.baseUrl}/v1/files/${fileKey}/variables/local`;
    // Performs the API request using axios.
    const resp = await axios.request<GetLocalVariablesResponse>({
      url: figmaUrlLocation,
      headers: {
        Accept: '*/*',
        'X-Figma-Token': this.token, // Sets the Figma API token in the request header.
      },
    });

    // Returns the API response data along with the URL used for the request.
    return { ...resp.data, figmaUrlLocation: figmaUrlLocation };
  }
}
