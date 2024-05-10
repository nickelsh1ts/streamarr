using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace PlexSSO.Service.HealthCheck
{
    public static class HealthChecker
    {
        private enum HealthCheckReturnCodes
        {
            Healthy = 0,
            Unhealthy = 1,
            Reserved = 2
        }

        public static async Task CheckHealth(string url)
        {
            try
            {
                var status = await GetStatus(url);
                Environment.Exit((int)status);
            }
            catch (Exception)
            {
                Environment.Exit((int)HealthCheckReturnCodes.Unhealthy);
            }
        }

        private static async Task<HealthCheckReturnCodes> GetStatus(string url)
        {
            var httpClient = new HttpClient();
            var response = await httpClient.GetStringAsync(url);
            if (response == "Healthy")
            {
                return HealthCheckReturnCodes.Healthy;
            }

            return HealthCheckReturnCodes.Unhealthy;
        }
    }
}
