import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					maxWidth: 'none',
  					color: 'hsl(var(--foreground))',
  					a: {
  						color: 'hsl(var(--primary))',
  						textDecoration: 'none',
  						'&:hover': {
  							color: 'hsl(var(--primary))',
  							textDecoration: 'underline',
  						},
  					},
  					'h1, h2, h3, h4, h5, h6': {
  						color: 'hsl(var(--foreground))',
  						fontWeight: '700',
  					},
  					h1: {
  						fontSize: '2.25rem',
  						lineHeight: '2.5rem',
  						marginTop: '0',
  						marginBottom: '1rem',
  					},
  					h2: {
  						fontSize: '1.875rem',
  						lineHeight: '2.25rem',
  						marginTop: '2rem',
  						marginBottom: '1rem',
  						borderBottom: '1px solid hsl(var(--border))',
  						paddingBottom: '0.5rem',
  					},
  					h3: {
  						fontSize: '1.5rem',
  						lineHeight: '2rem',
  						marginTop: '1.5rem',
  						marginBottom: '0.75rem',
  					},
  					h4: {
  						fontSize: '1.25rem',
  						lineHeight: '1.75rem',
  						marginTop: '1.5rem',
  						marginBottom: '0.75rem',
  					},
  					p: {
  						marginTop: '1rem',
  						marginBottom: '1rem',
  						lineHeight: '1.75',
  					},
  					blockquote: {
  						borderLeft: '4px solid hsl(var(--primary))',
  						backgroundColor: 'hsl(var(--muted))',
  						padding: '1rem',
  						margin: '1.5rem 0',
  						borderRadius: '0.5rem',
  						fontStyle: 'italic',
  					},
  					'blockquote p': {
  						margin: '0',
  					},
  					code: {
  						backgroundColor: 'hsl(var(--muted))',
  						padding: '0.125rem 0.25rem',
  						borderRadius: '0.25rem',
  						fontSize: '0.875em',
  						fontWeight: '600',
  						color: 'hsl(var(--foreground))',
  					},
  					'code::before': {
  						content: '""',
  					},
  					'code::after': {
  						content: '""',
  					},
  					pre: {
  						backgroundColor: 'hsl(var(--muted))',
  						padding: '1rem',
  						borderRadius: '0.5rem',
  						overflow: 'auto',
  						border: '1px solid hsl(var(--border))',
  					},
  					'pre code': {
  						backgroundColor: 'transparent',
  						padding: '0',
  						fontSize: '0.875rem',
  						fontWeight: 'normal',
  					},
  					ul: {
  						listStyleType: 'disc',
  						paddingLeft: '1.5rem',
  						margin: '1rem 0',
  					},
  					ol: {
  						listStyleType: 'decimal',
  						paddingLeft: '1.5rem',
  						margin: '1rem 0',
  					},
  					'ul li, ol li': {
  						margin: '0.5rem 0',
  						lineHeight: '1.75',
  					},
  					'ul li p, ol li p': {
  						margin: '0.5rem 0',
  					},
  					table: {
  						width: '100%',
  						borderCollapse: 'collapse',
  						margin: '1.5rem 0',
  						fontSize: '0.875rem',
  					},
  					'table th': {
  						backgroundColor: 'hsl(var(--muted))',
  						border: '1px solid hsl(var(--border))',
  						padding: '0.75rem',
  						textAlign: 'left',
  						fontWeight: '600',
  					},
  					'table td': {
  						border: '1px solid hsl(var(--border))',
  						padding: '0.75rem',
  					},
  					'table tr:nth-child(even)': {
  						backgroundColor: 'hsl(var(--muted) / 0.3)',
  					},
  					img: {
  						borderRadius: '0.5rem',
  						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  						margin: '1.5rem auto',
  					},
  					hr: {
  						borderColor: 'hsl(var(--border))',
  						margin: '2rem 0',
  					},
  					strong: {
  						color: 'hsl(var(--foreground))',
  						fontWeight: '700',
  					},
  					em: {
  						fontStyle: 'italic',
  					},
  				},
  			},
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
