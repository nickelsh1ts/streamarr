using System;
using System.IO;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Service;
using PlexSSO.Service.Config;
using PlexSSO.Service.Plugin;

namespace PlexSSO
{
    public class Startup
    {
        private IConfigurationService<PlexSsoConfig> ConfigurationService { get; }
        
        public Startup(IConfiguration configuration)
        {
            ConfigurationService = ServiceRegistry.LoadConfiguration(configuration);
            Console.WriteLine(ConfigurationService.Config.ToString());
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(ConfigurationService.GetConfigurationDirectory()))
                .SetDefaultKeyLifetime(TimeSpan.FromDays(Constants.KeyLifeSpanDays))
                .SetApplicationName(Constants.ApplicationName);

            services.AddAntiforgery(options =>
            {
                options.Cookie.Name = Constants.CsrfCookieName;
                options.HeaderName = Constants.CsrfHeaderName;
            });
            
            services.AddControllersWithViews().AddJsonOptions(opt =>
            {
                opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ui";
            });

            services.AddHttpClient();
            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(options =>
                {
                    options.AccessDeniedPath = Constants.FourOhThreePath;
                    options.Cookie.Name = Constants.CookieName;
                    options.LoginPath = $"/{Constants.ApiPrefix}login";
                    options.LogoutPath = $"/{Constants.ApiPrefix}logout";
                    options.ExpireTimeSpan = TimeSpan.FromDays(Constants.CookieExpireDays);
                    var cookieDomain = ConfigurationService.Config.CookieDomain;
                    if (!string.IsNullOrWhiteSpace(cookieDomain))
                    {
                        options.Cookie.Domain = cookieDomain;
                    }
                });
            services.AddHealthChecks();
            services.TryAddSingleton(ConfigurationService);
            ServiceRegistry.RegisterServices(services);
            PluginLoader.LoadPlugins(ConfigurationService, services);
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IAntiforgery antiForgery)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler(Constants.FourOhThreePath);
            }
            app.Use((context, next) => {
                var tokens = antiForgery.GetAndStoreTokens(context);
                context.Response.Cookies.Append(Constants.CsrfHeaderName, tokens.RequestToken, new CookieOptions { HttpOnly = false });
                context.Response.Headers.Add(Constants.PoweredByHeaderName, Constants.PoweredByHeaderValue);
                return next.Invoke();
            });
            app.UseStaticFiles();
            app.UseSpaStaticFiles();
            app.UseRouting();
            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ui";
            });

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(name: "default", pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapHealthChecks(Constants.HealthcheckPath);
            });
        }
    }
}
